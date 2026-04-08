from django.contrib import admin
from .models import Conversa, Mensagem


class MensagemInline(admin.TabularInline):
    model = Mensagem
    extra = 0
    readonly_fields = ['enviada_em']


@admin.register(Conversa)
class ConversaAdmin(admin.ModelAdmin):
    list_display = ['telefone', 'cliente', 'status', 'iniciada_em', 'atualizada_em']
    list_filter = ['status']
    search_fields = ['telefone', 'cliente__nome']
    inlines = [MensagemInline]
