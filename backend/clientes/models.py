from django.db import models


class Cliente(models.Model):
    nome = models.CharField(max_length=150)
    telefone = models.CharField(max_length=20, unique=True)  # número WhatsApp
    email = models.EmailField(blank=True)
    data_nascimento = models.DateField(null=True, blank=True)
    observacoes = models.TextField(blank=True)
    ativo = models.BooleanField(default=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Cliente'
        verbose_name_plural = 'Clientes'
        ordering = ['nome']

    def __str__(self):
        return f'{self.nome} ({self.telefone})'

    @property
    def primeiro_nome(self):
        return self.nome.split()[0]
