from django.contrib import admin
from .models import Agendamento, BloqueioAgenda


@admin.register(Agendamento)
class AgendamentoAdmin(admin.ModelAdmin):
    list_display = ['cliente', 'profissional', 'data_hora', 'status', 'valor_total']
    list_filter = ['status', 'profissional', 'criado_via_whatsapp']
    search_fields = ['cliente__nome', 'profissional__nome']
    date_hierarchy = 'data_hora'
    readonly_fields = ['valor_total', 'criado_em', 'atualizado_em']


@admin.register(BloqueioAgenda)
class BloqueioAgendaAdmin(admin.ModelAdmin):
    list_display = ['profissional', 'data_hora_inicio', 'data_hora_fim', 'motivo']
    list_filter = ['profissional']
