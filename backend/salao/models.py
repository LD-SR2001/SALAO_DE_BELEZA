from django.db import models


class Especialidade(models.Model):
    CABELO = 'cabelo'
    UNHA = 'unha'
    SOBRANCELHA = 'sobrancelha'
    OUTROS = 'outros'

    TIPO_CHOICES = [
        (CABELO, 'Cabelo'),
        (UNHA, 'Unha'),
        (SOBRANCELHA, 'Sobrancelha'),
        (OUTROS, 'Outros'),
    ]

    nome = models.CharField(max_length=100)
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)

    class Meta:
        verbose_name = 'Especialidade'
        verbose_name_plural = 'Especialidades'

    def __str__(self):
        return self.nome


class Profissional(models.Model):
    nome = models.CharField(max_length=150)
    telefone = models.CharField(max_length=20, blank=True)
    descricao = models.TextField(blank=True, default='', help_text='Apresentação exibida no sistema e futuramente no site')
    especialidades = models.ManyToManyField(Especialidade, related_name='profissionais')
    ativo = models.BooleanField(default=True)
    foto = models.ImageField(upload_to='profissionais/', blank=True, null=True)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Profissional'
        verbose_name_plural = 'Profissionais'
        ordering = ['nome']

    def __str__(self):
        return self.nome


class PortfolioItem(models.Model):
    profissional = models.ForeignKey(
        Profissional, on_delete=models.CASCADE, related_name='portfolio'
    )
    foto = models.ImageField(upload_to='portfolio/')
    descricao = models.CharField(max_length=200, blank=True)
    ordem = models.PositiveIntegerField(default=0)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Item de Portfólio'
        verbose_name_plural = 'Portfólio'
        ordering = ['ordem', '-criado_em']

    def __str__(self):
        return f'Portfólio – {self.profissional.nome}'


class HorarioTrabalho(models.Model):
    DIAS = [
        (0, 'Segunda-feira'),
        (1, 'Terça-feira'),
        (2, 'Quarta-feira'),
        (3, 'Quinta-feira'),
        (4, 'Sexta-feira'),
        (5, 'Sábado'),
        (6, 'Domingo'),
    ]

    profissional = models.ForeignKey(
        Profissional, on_delete=models.CASCADE, related_name='horarios'
    )
    dia_semana = models.IntegerField(choices=DIAS)
    hora_inicio = models.TimeField()
    hora_fim = models.TimeField()
    ativo = models.BooleanField(default=True)

    class Meta:
        verbose_name = 'Horário de Trabalho'
        verbose_name_plural = 'Horários de Trabalho'
        unique_together = ('profissional', 'dia_semana')
        ordering = ['dia_semana', 'hora_inicio']

    def __str__(self):
        return f'{self.profissional.nome} - {self.get_dia_semana_display()}'


class Servico(models.Model):
    nome = models.CharField(max_length=150)
    descricao = models.TextField(blank=True)
    especialidade = models.ForeignKey(
        Especialidade, on_delete=models.PROTECT, related_name='servicos'
    )
    duracao_minutos = models.PositiveIntegerField(help_text='Duração em minutos')
    preco = models.DecimalField(max_digits=8, decimal_places=2)
    ativo = models.BooleanField(default=True)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Serviço'
        verbose_name_plural = 'Serviços'
        ordering = ['especialidade__tipo', 'nome']

    def __str__(self):
        return f'{self.nome} - R$ {self.preco}'


class ConfiguracaoSalao(models.Model):
    nome = models.CharField(max_length=150)
    telefone = models.CharField(max_length=20, blank=True)
    endereco = models.TextField(blank=True)
    instagram = models.CharField(max_length=100, blank=True)
    mensagem_boas_vindas = models.TextField(
        default='Olá! Bem-vindo(a) ao nosso salão. Como posso ajudar?'
    )
    mensagem_fora_horario = models.TextField(
        default='No momento estamos fora do horário de atendimento. Retornaremos em breve!'
    )
    horario_abertura = models.TimeField(default='08:00')
    horario_fechamento = models.TimeField(default='19:00')
    atendimento_sabado = models.BooleanField(default=True)
    atendimento_domingo = models.BooleanField(default=False)
    antecedencia_minima_horas = models.PositiveIntegerField(
        default=2, help_text='Horas mínimas de antecedência para agendamento'
    )
    antecedencia_lembrete_horas = models.PositiveIntegerField(
        default=24, help_text='Horas antes do agendamento para enviar lembrete'
    )

    class Meta:
        verbose_name = 'Configuração do Salão'
        verbose_name_plural = 'Configurações do Salão'

    def __str__(self):
        return self.nome
