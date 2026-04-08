from django.db import models
from django.utils import timezone


class Agendamento(models.Model):
    AGUARDANDO = 'aguardando'
    CONFIRMADO = 'confirmado'
    CONCLUIDO = 'concluido'
    CANCELADO = 'cancelado'
    NAO_COMPARECEU = 'nao_compareceu'

    STATUS_CHOICES = [
        (AGUARDANDO, 'Aguardando confirmação'),
        (CONFIRMADO, 'Confirmado'),
        (CONCLUIDO, 'Concluído'),
        (CANCELADO, 'Cancelado'),
        (NAO_COMPARECEU, 'Não compareceu'),
    ]

    cliente = models.ForeignKey(
        'clientes.Cliente', on_delete=models.PROTECT, related_name='agendamentos'
    )
    profissional = models.ForeignKey(
        'salao.Profissional', on_delete=models.PROTECT, related_name='agendamentos'
    )
    servicos = models.ManyToManyField('salao.Servico', related_name='agendamentos')
    data_hora = models.DateTimeField()
    data_hora_fim = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=AGUARDANDO)
    observacoes = models.TextField(blank=True)
    motivo_cancelamento = models.TextField(blank=True, default='')
    valor_total = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    lembrete_enviado = models.BooleanField(default=False)
    criado_via_whatsapp = models.BooleanField(default=False)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Agendamento'
        verbose_name_plural = 'Agendamentos'
        ordering = ['data_hora']

    def __str__(self):
        return (
            f'{self.cliente.nome} - {self.profissional.nome} - '
            f'{self.data_hora.strftime("%d/%m/%Y %H:%M")}'
        )

    def calcular_valor_total(self):
        total = sum(s.preco for s in self.servicos.all())
        self.valor_total = total
        self.save(update_fields=['valor_total'])
        return total

    @property
    def esta_no_futuro(self):
        return self.data_hora > timezone.now()


class BloqueioAgenda(models.Model):
    profissional = models.ForeignKey(
        'salao.Profissional', on_delete=models.CASCADE, related_name='bloqueios'
    )
    data_hora_inicio = models.DateTimeField()
    data_hora_fim = models.DateTimeField()
    motivo = models.CharField(max_length=200, blank=True)

    class Meta:
        verbose_name = 'Bloqueio de Agenda'
        verbose_name_plural = 'Bloqueios de Agenda'
        ordering = ['data_hora_inicio']

    def __str__(self):
        return (
            f'{self.profissional.nome} bloqueado em '
            f'{self.data_hora_inicio.strftime("%d/%m/%Y %H:%M")}'
        )
