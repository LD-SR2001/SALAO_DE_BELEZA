from django.db import models


class Conversa(models.Model):
    ATIVA = 'ativa'
    ENCERRADA = 'encerrada'
    TRANSFERIDA = 'transferida'

    STATUS_CHOICES = [
        (ATIVA, 'Ativa'),
        (ENCERRADA, 'Encerrada'),
        (TRANSFERIDA, 'Transferida para humano'),
    ]

    cliente = models.ForeignKey(
        'clientes.Cliente',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='conversas',
    )
    telefone = models.CharField(max_length=20)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=ATIVA)
    iniciada_em = models.DateTimeField(auto_now_add=True)
    atualizada_em = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Conversa'
        verbose_name_plural = 'Conversas'
        ordering = ['-atualizada_em']

    def __str__(self):
        nome = self.cliente.nome if self.cliente else self.telefone
        return f'Conversa com {nome}'


class Mensagem(models.Model):
    ENTRADA = 'entrada'
    SAIDA = 'saida'

    DIRECAO_CHOICES = [
        (ENTRADA, 'Recebida'),
        (SAIDA, 'Enviada'),
    ]

    conversa = models.ForeignKey(
        Conversa, on_delete=models.CASCADE, related_name='mensagens'
    )
    direcao = models.CharField(max_length=10, choices=DIRECAO_CHOICES)
    conteudo = models.TextField()
    enviada_em = models.DateTimeField(auto_now_add=True)
    message_id_externo = models.CharField(max_length=100, blank=True)

    class Meta:
        verbose_name = 'Mensagem'
        verbose_name_plural = 'Mensagens'
        ordering = ['enviada_em']

    def __str__(self):
        return f'[{self.direcao}] {self.conteudo[:50]}'
