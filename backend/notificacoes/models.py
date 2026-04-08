from django.db import models


class Notificacao(models.Model):
    LEMBRETE = 'lembrete'
    CONFIRMACAO = 'confirmacao'
    CANCELAMENTO = 'cancelamento'
    REMARCACAO = 'remarcacao'

    TIPO_CHOICES = [
        (LEMBRETE, 'Lembrete'),
        (CONFIRMACAO, 'Confirmação'),
        (CANCELAMENTO, 'Cancelamento'),
        (REMARCACAO, 'Remarcação'),
    ]

    PENDENTE = 'pendente'
    ENVIADA = 'enviada'
    FALHA = 'falha'

    STATUS_CHOICES = [
        (PENDENTE, 'Pendente'),
        (ENVIADA, 'Enviada'),
        (FALHA, 'Falha'),
    ]

    agendamento = models.ForeignKey(
        'agenda.Agendamento', on_delete=models.CASCADE, related_name='notificacoes'
    )
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    mensagem = models.TextField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default=PENDENTE)
    agendada_para = models.DateTimeField()
    enviada_em = models.DateTimeField(null=True, blank=True)
    erro = models.TextField(blank=True)

    class Meta:
        verbose_name = 'Notificação'
        verbose_name_plural = 'Notificações'
        ordering = ['agendada_para']

    def __str__(self):
        return f'{self.get_tipo_display()} - {self.agendamento}'
