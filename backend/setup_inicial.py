"""
Script para popular o banco com dados iniciais do salão.
Execute: python setup_inicial.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from salao.models import Especialidade, Profissional, HorarioTrabalho, Servico, ConfiguracaoSalao

print("Criando configuração do salão...")
config, _ = ConfiguracaoSalao.objects.get_or_create(
    nome='Meu Salão',
    defaults={
        'telefone': '5511999999999',
        'mensagem_boas_vindas': 'Olá! Bem-vindo(a) ao Meu Salão 💜 Como posso ajudar?',
        'horario_abertura': '09:00',
        'horario_fechamento': '19:00',
        'atendimento_sabado': True,
        'atendimento_domingo': False,
    }
)

print("Criando especialidades...")
cabelo, _ = Especialidade.objects.get_or_create(nome='Cabelo', tipo='cabelo')
unha, _ = Especialidade.objects.get_or_create(nome='Unhas', tipo='unha')
sobrancelha, _ = Especialidade.objects.get_or_create(nome='Sobrancelha', tipo='sobrancelha')

print("Criando serviços...")
servicos_data = [
    # Cabelo
    ('Corte feminino', cabelo, 60, 80),
    ('Corte masculino', cabelo, 30, 45),
    ('Coloração', cabelo, 120, 200),
    ('Mechas / Luzes', cabelo, 180, 350),
    ('Escova progressiva', cabelo, 180, 300),
    ('Hidratação', cabelo, 60, 80),
    ('Escova simples', cabelo, 45, 60),
    # Unhas
    ('Manicure', unha, 60, 40),
    ('Pedicure', unha, 60, 45),
    ('Gel/Acrigel', unha, 90, 120),
    ('Nail art', unha, 30, 30),
    # Sobrancelha
    ('Design de sobrancelha', sobrancelha, 30, 35),
    ('Micropigmentação', sobrancelha, 90, 250),
    ('Henna', sobrancelha, 30, 30),
]

for nome, esp, duracao, preco in servicos_data:
    Servico.objects.get_or_create(
        nome=nome, especialidade=esp,
        defaults={'duracao_minutos': duracao, 'preco': preco}
    )

print("Criando profissionais...")
# Profissionais de cabelo
ana, _ = Profissional.objects.get_or_create(nome='Ana', defaults={'telefone': ''})
ana.especialidades.add(cabelo)

julia, _ = Profissional.objects.get_or_create(nome='Júlia', defaults={'telefone': ''})
julia.especialidades.add(cabelo)

# Profissional de unhas
carla, _ = Profissional.objects.get_or_create(nome='Carla', defaults={'telefone': ''})
carla.especialidades.add(unha)

# Profissional de sobrancelha
mariana, _ = Profissional.objects.get_or_create(nome='Mariana', defaults={'telefone': ''})
mariana.especialidades.add(sobrancelha)

print("Criando horários de trabalho...")
# Segunda a sexta + sábado para todos
DIAS_UTEIS = [0, 1, 2, 3, 4]  # seg-sex
for prof in [ana, julia, carla, mariana]:
    for dia in DIAS_UTEIS:
        HorarioTrabalho.objects.get_or_create(
            profissional=prof, dia_semana=dia,
            defaults={'hora_inicio': '09:00', 'hora_fim': '18:00'}
        )
    # Sábado até 17h
    HorarioTrabalho.objects.get_or_create(
        profissional=prof, dia_semana=5,
        defaults={'hora_inicio': '09:00', 'hora_fim': '17:00'}
    )

print("Criando superusuário admin...")
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@salao.com', 'admin123')
    print("  → Usuário: admin | Senha: admin123")
else:
    print("  → Usuário admin já existe.")

print("\n✓ Setup concluído!")
print("  Acesse o painel em: http://localhost:5173")
print("  API Docs em: http://localhost:8000/api/docs/")
print("  Django Admin em: http://localhost:8000/admin/")
