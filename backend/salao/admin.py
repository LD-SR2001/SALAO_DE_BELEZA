from django.contrib import admin
from .models import Especialidade, Profissional, HorarioTrabalho, Servico, ConfiguracaoSalao


@admin.register(Especialidade)
class EspecialidadeAdmin(admin.ModelAdmin):
    list_display = ['nome', 'tipo']
    list_filter = ['tipo']


class HorarioTrabalhoInline(admin.TabularInline):
    model = HorarioTrabalho
    extra = 0


@admin.register(Profissional)
class ProfissionalAdmin(admin.ModelAdmin):
    list_display = ['nome', 'ativo', 'telefone']
    list_filter = ['ativo', 'especialidades']
    filter_horizontal = ['especialidades']
    inlines = [HorarioTrabalhoInline]


@admin.register(Servico)
class ServicoAdmin(admin.ModelAdmin):
    list_display = ['nome', 'especialidade', 'duracao_minutos', 'preco', 'ativo']
    list_filter = ['ativo', 'especialidade']
    search_fields = ['nome']


@admin.register(ConfiguracaoSalao)
class ConfiguracaoSalaoAdmin(admin.ModelAdmin):
    list_display = ['nome', 'telefone']
