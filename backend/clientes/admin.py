from django.contrib import admin
from .models import Cliente


@admin.register(Cliente)
class ClienteAdmin(admin.ModelAdmin):
    list_display = ['nome', 'telefone', 'email', 'ativo', 'criado_em']
    list_filter = ['ativo']
    search_fields = ['nome', 'telefone', 'email']
