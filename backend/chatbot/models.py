from django.db import models


class ContextoConversa(models.Model):
    """Armazena o contexto/estado da conversa para o chatbot."""

    INICIO = 'inicio'
    AGUARDANDO_SERVICO = 'aguardando_servico'
    AGUARDANDO_PROFISSIONAL = 'aguardando_profissional'
    AGUARDANDO_DATA = 'aguardando_data'
    AGUARDANDO_HORARIO = 'aguardando_horario'
    AGUARDANDO_CONFIRMACAO = 'aguardando_confirmacao'
    ORCAMENTO = 'orcamento'
    LIVRE = 'livre'

    ESTADO_CHOICES = [
        (INICIO, 'Início'),
        (AGUARDANDO_SERVICO, 'Aguardando escolha de serviço'),
        (AGUARDANDO_PROFISSIONAL, 'Aguardando escolha de profissional'),
        (AGUARDANDO_DATA, 'Aguardando data'),
        (AGUARDANDO_HORARIO, 'Aguardando horário'),
        (AGUARDANDO_CONFIRMACAO, 'Aguardando confirmação'),
        (ORCAMENTO, 'Montando orçamento'),
        (LIVRE, 'Conversa livre'),
    ]

    conversa = models.OneToOneField(
        'whatsapp.Conversa', on_delete=models.CASCADE, related_name='contexto'
    )
    estado = models.CharField(max_length=30, choices=ESTADO_CHOICES, default=INICIO)
    dados_temp = models.JSONField(default=dict, blank=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Contexto de Conversa'
        verbose_name_plural = 'Contextos de Conversa'

    def __str__(self):
        return f'Contexto: {self.conversa} [{self.estado}]'
