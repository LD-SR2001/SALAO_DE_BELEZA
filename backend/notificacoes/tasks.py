from celery import shared_task
from django.utils import timezone
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)


@shared_task
def enviar_lembretes_do_dia():
    """
    Verifica agendamentos nas próximas X horas e envia lembretes.
    Roda a cada 1 hora via Celery Beat.
    """
    from agenda.models import Agendamento
    from salao.models import ConfiguracaoSalao
    from whatsapp.evolution import evolution_client

    config = ConfiguracaoSalao.objects.first()
    horas = config.antecedencia_lembrete_horas if config else 24

    agora = timezone.now()
    janela_inicio = agora + timedelta(hours=horas - 1)
    janela_fim = agora + timedelta(hours=horas + 1)

    agendamentos = Agendamento.objects.filter(
        status__in=[Agendamento.AGUARDANDO, Agendamento.CONFIRMADO],
        data_hora__range=(janela_inicio, janela_fim),
        lembrete_enviado=False,
    ).select_related('cliente', 'profissional').prefetch_related('servicos')

    enviados = 0
    for ag in agendamentos:
        try:
            servicos_nomes = ', '.join(s.nome for s in ag.servicos.all())
            data_fmt = ag.data_hora.strftime('%d/%m/%Y às %H:%M')
            mensagem = (
                f'Olá, {ag.cliente.primeiro_nome}! 😊\n\n'
                f'Este é um lembrete do seu agendamento:\n'
                f'📋 *{servicos_nomes}*\n'
                f'👩 *{ag.profissional.nome}*\n'
                f'📅 *{data_fmt}*\n\n'
                f'Aguardamos você! Se precisar cancelar ou remarcar, é só responder aqui. 💜'
            )
            evolution_client.enviar_mensagem(ag.cliente.telefone, mensagem)
            ag.lembrete_enviado = True
            ag.save(update_fields=['lembrete_enviado'])
            enviados += 1
        except Exception as e:
            logger.error(f'[Lembrete] Erro ao enviar para agendamento {ag.id}: {e}')

    logger.info(f'[Lembretes] {enviados} enviados.')
    return enviados


@shared_task
def notificar_cancelamento(agendamento_id: int):
    """Envia notificação de cancelamento ao cliente."""
    from agenda.models import Agendamento
    from whatsapp.evolution import evolution_client

    try:
        ag = Agendamento.objects.select_related('cliente', 'profissional').get(id=agendamento_id)
        data_fmt = ag.data_hora.strftime('%d/%m/%Y às %H:%M')
        mensagem = (
            f'Olá, {ag.cliente.primeiro_nome}! 😔\n\n'
            f'Seu agendamento do dia *{data_fmt}* com *{ag.profissional.nome}* '
            f'foi cancelado.\n\n'
            f'Quando quiser remarcar, é só nos chamar aqui! 💜'
        )
        evolution_client.enviar_mensagem(ag.cliente.telefone, mensagem)
    except Exception as e:
        logger.error(f'[Cancelamento] Erro: {e}')


@shared_task
def enviar_confirmacao_agendamento(agendamento_id: int):
    """Envia confirmação de agendamento ao cliente."""
    from agenda.models import Agendamento
    from whatsapp.evolution import evolution_client

    try:
        ag = Agendamento.objects.select_related('cliente', 'profissional').prefetch_related('servicos').get(id=agendamento_id)
        servicos_nomes = ', '.join(s.nome for s in ag.servicos.all())
        data_fmt = ag.data_hora.strftime('%d/%m/%Y às %H:%M')
        mensagem = (
            f'✅ *Agendamento confirmado!*\n\n'
            f'Olá, {ag.cliente.primeiro_nome}!\n\n'
            f'📋 *Serviço(s):* {servicos_nomes}\n'
            f'👩 *Profissional:* {ag.profissional.nome}\n'
            f'📅 *Data/Hora:* {data_fmt}\n'
            f'💰 *Valor:* R$ {ag.valor_total}\n\n'
            f'Te esperamos! 💜'
        )
        evolution_client.enviar_mensagem(ag.cliente.telefone, mensagem)
    except Exception as e:
        logger.error(f'[Confirmação] Erro: {e}')
