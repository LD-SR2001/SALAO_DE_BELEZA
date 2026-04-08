from rest_framework import serializers
from .models import Conversa, Mensagem


class MensagemSerializer(serializers.ModelSerializer):
    class Meta:
        model = Mensagem
        fields = '__all__'


class ConversaSerializer(serializers.ModelSerializer):
    mensagens = MensagemSerializer(many=True, read_only=True)
    cliente_nome = serializers.CharField(source='cliente.nome', read_only=True)
    total_mensagens = serializers.SerializerMethodField()

    class Meta:
        model = Conversa
        fields = [
            'id', 'cliente', 'cliente_nome', 'telefone', 'status',
            'iniciada_em', 'atualizada_em', 'mensagens', 'total_mensagens',
        ]

    def get_total_mensagens(self, obj):
        return obj.mensagens.count()
