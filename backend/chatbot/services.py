import json
import anthropic
from django.conf import settings
from django.utils import timezone
from salao.models import Servico, Profissional, ConfiguracaoSalao
from clientes.models import Cliente
from agenda.models import Agendamento
from agenda.services import AgendaService
from whatsapp.models import Conversa, Mensagem
from .models import ContextoConversa
import logging

logger = logging.getLogger(__name__)
client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)


def _get_contexto_salao() -> str:
    config = ConfiguracaoSalao.objects.first()
    nome_salao = config.nome if config else settings.SALAO_NOME

    servicos = Servico.objects.filter(ativo=True).select_related('especialidade')
    servicos_txt = '\n'.join(
        f'- {s.nome} ({s.especialidade.nome}): R$ {s.preco}, {s.duracao_minutos} min'
        for s in servicos
    )

    profissionais = Profissional.objects.filter(ativo=True).prefetch_related('especialidades')
    profissionais_txt = '\n'.join(
        f'- {p.nome}: {", ".join(e.nome for e in p.especialidades.all())}'
        for p in profissionais
    )

    horario = ''
    if config:
        horario = f'Segunda a sexta: {config.horario_abertura} às {config.horario_fechamento}\n'
        if config.atendimento_sabado:
            horario += f'Sábado: {config.horario_abertura} às {config.horario_fechamento}\n'
        horario += 'Domingo: fechado\n' if not (config and config.atendimento_domingo) else ''

    return f"""
Você é a assistente virtual do {nome_salao}, um salão de beleza.
Sua função é atender clientes pelo WhatsApp de forma simpática, eficiente e natural.

SERVIÇOS DISPONÍVEIS:
{servicos_txt}

PROFISSIONAIS:
{profissionais_txt}

HORÁRIOS DE FUNCIONAMENTO:
{horario}

REGRAS IMPORTANTES:
- Responda sempre em português brasileiro, de forma amigável e profissional.
- Quando um cliente novo entrar em contato, pergunte o nome dele logo no início.
- Para agendar, você precisa: nome do cliente, serviço desejado, profissional (se tiver preferência), data e horário.
- Sempre confirme os detalhes antes de finalizar um agendamento.
- Se o cliente não tiver preferência de profissional, sugira quem tem disponibilidade.
- Para orçamentos, some os preços dos serviços solicitados.
- Nunca invente horários ou profissionais que não existem nos dados acima.
- Use emojis com moderação para deixar a conversa mais agradável.
- Data de hoje: {timezone.now().strftime('%d/%m/%Y, %A')}.
"""


def _historico_mensagens(conversa: Conversa, limite: int = 10) -> list[dict]:
    mensagens = conversa.mensagens.order_by('-enviada_em')[:limite]
    resultado = []
    for msg in reversed(list(mensagens)):
        role = 'user' if msg.direcao == Mensagem.ENTRADA else 'assistant'
        resultado.append({'role': role, 'content': msg.conteudo})
    return resultado


def _cliente_sem_nome(cliente: Cliente) -> bool:
    """Retorna True se o cliente ainda não tem nome real (só tem o telefone como nome)."""
    return cliente.nome == cliente.telefone or cliente.nome.replace('+', '').replace(' ', '').isdigit()


def _tentar_extrair_nome(historico: list[dict], texto_atual: str) -> str | None:
    """
    Usa Claude para verificar se o cliente mencionou seu nome na conversa.
    Retorna o nome encontrado ou None.
    """
    # Monta contexto compacto com as últimas mensagens + mensagem atual
    msgs_txt = '\n'.join(
        f"{'Cliente' if m['role'] == 'user' else 'Assistente'}: {m['content']}"
        for m in historico[-6:]
    )
    if not any(m['role'] == 'user' for m in historico[-6:]):
        return None

    try:
        resp = client.messages.create(
            model='claude-haiku-4-5-20251001',  # modelo rápido para tarefa simples
            max_tokens=50,
            system=(
                'Você extrai nomes de pessoas de conversas. '
                'Responda SOMENTE com o primeiro nome encontrado, ou "null" se não houver nome. '
                'Ignore nomes de profissionais do salão. Apenas o nome do CLIENTE.'
            ),
            messages=[{
                'role': 'user',
                'content': f'Conversa:\n{msgs_txt}\n\nO cliente disse seu nome nesta conversa? Se sim, qual?',
            }],
        )
        nome = resp.content[0].text.strip()
        if nome.lower() in ('null', 'não', 'nao', 'nenhum', ''):
            return None
        # Sanidade: nome razoável (2-50 chars, sem números)
        if 2 <= len(nome) <= 50 and not any(c.isdigit() for c in nome):
            return nome.capitalize()
    except Exception as e:
        logger.warning(f'[Chatbot] Erro ao extrair nome: {e}')
    return None


def processar_mensagem(telefone: str, texto: str) -> str:
    # Busca ou cria cliente
    cliente, criado = Cliente.objects.get_or_create(
        telefone=telefone,
        defaults={'nome': telefone},
    )

    # Busca ou cria conversa ativa
    conversa, _ = Conversa.objects.get_or_create(
        telefone=telefone,
        status=Conversa.ATIVA,
        defaults={'cliente': cliente},
    )
    if conversa.cliente is None:
        conversa.cliente = cliente
        conversa.save()

    # Salva mensagem recebida
    Mensagem.objects.create(
        conversa=conversa,
        direcao=Mensagem.ENTRADA,
        conteudo=texto,
    )

    # Monta histórico
    historico = _historico_mensagens(conversa)
    if not historico or historico[-1]['content'] != texto:
        historico.append({'role': 'user', 'content': texto})

    # Tenta extrair nome se o cliente ainda não tem um
    if _cliente_sem_nome(cliente):
        nome_encontrado = _tentar_extrair_nome(historico, texto)
        if nome_encontrado:
            cliente.nome = nome_encontrado
            cliente.save(update_fields=['nome'])
            logger.info(f'[Chatbot] Nome "{nome_encontrado}" salvo para {telefone}')

    # Chama Claude principal
    try:
        resposta = client.messages.create(
            model='claude-sonnet-4-6',
            max_tokens=1024,
            system=_get_contexto_salao(),
            messages=historico,
        )
        texto_resposta = resposta.content[0].text
    except Exception as e:
        texto_resposta = 'Desculpe, tive um problema técnico. Por favor, tente novamente em instantes.'
        logger.error(f'[Chatbot] Erro ao chamar Claude: {e}')

    # Pós-processamento de intenções
    texto_resposta = _processar_intencao(conversa, cliente, texto, texto_resposta)

    # Salva resposta
    Mensagem.objects.create(
        conversa=conversa,
        direcao=Mensagem.SAIDA,
        conteudo=texto_resposta,
    )

    return texto_resposta


def _processar_intencao(conversa: Conversa, cliente: Cliente, texto_usuario: str, resposta_claude: str) -> str:
    texto_lower = texto_usuario.lower()
    palavras_disponibilidade = ['disponibilidade', 'horário livre', 'horarios livres', 'quando tem', 'tem horário']
    if any(p in texto_lower for p in palavras_disponibilidade):
        return _responder_disponibilidade(cliente, texto_usuario, resposta_claude)
    return resposta_claude


def _responder_disponibilidade(cliente: Cliente, texto: str, resposta_padrao: str) -> str:
    from datetime import date, timedelta
    amanha = date.today() + timedelta(days=1)
    linhas = [resposta_padrao, '\n\n📅 *Horários disponíveis para amanhã:*']
    for prof in Profissional.objects.filter(ativo=True)[:3]:
        horarios = AgendaService.horarios_disponiveis(prof, amanha.isoformat())
        if horarios:
            linhas.append(f'\n*{prof.nome}*: {", ".join(horarios[:5])}{"..." if len(horarios) > 5 else ""}')
    return '\n'.join(linhas)
