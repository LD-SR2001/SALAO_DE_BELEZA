from rest_framework import serializers
from .models import Cliente


class ClienteSerializer(serializers.ModelSerializer):
    total_agendamentos = serializers.SerializerMethodField()
    criado_via_whatsapp = serializers.SerializerMethodField()

    class Meta:
        model = Cliente
        fields = '__all__'

    def get_total_agendamentos(self, obj):
        return obj.agendamentos.count()

    def get_criado_via_whatsapp(self, obj):
        """Cliente foi criado automaticamente pelo chatbot se o nome original era o telefone."""
        from whatsapp.models import Conversa
        return Conversa.objects.filter(telefone=obj.telefone).exists()
