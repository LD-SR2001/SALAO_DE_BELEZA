from rest_framework import serializers
from .models import Agendamento, BloqueioAgenda
from clientes.serializers import ClienteSerializer
from salao.serializers import ProfissionalSerializer, ServicoSerializer


class AgendamentoSerializer(serializers.ModelSerializer):
    cliente_detalhes = ClienteSerializer(source='cliente', read_only=True)
    profissional_detalhes = ProfissionalSerializer(source='profissional', read_only=True)
    servicos_detalhes = ServicoSerializer(source='servicos', many=True, read_only=True)
    servicos_ids = serializers.PrimaryKeyRelatedField(
        many=True, source='servicos',
        queryset=__import__('salao.models', fromlist=['Servico']).Servico.objects.all(),
        write_only=True,
    )
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Agendamento
        fields = [
            'id', 'cliente', 'cliente_detalhes',
            'profissional', 'profissional_detalhes',
            'servicos_ids', 'servicos_detalhes',
            'data_hora', 'data_hora_fim', 'status', 'status_display',
            'observacoes', 'motivo_cancelamento', 'valor_total', 'lembrete_enviado',
            'criado_via_whatsapp', 'criado_em', 'atualizado_em',
        ]
        read_only_fields = ['valor_total', 'lembrete_enviado', 'data_hora_fim']


class AgendamentoCriarSerializer(serializers.ModelSerializer):
    servicos_ids = serializers.PrimaryKeyRelatedField(
        many=True, source='servicos',
        queryset=__import__('salao.models', fromlist=['Servico']).Servico.objects.all(),
    )

    class Meta:
        model = Agendamento
        fields = ['id', 'cliente', 'profissional', 'servicos_ids', 'data_hora', 'data_hora_fim', 'observacoes', 'valor_total']
        read_only_fields = ['id', 'data_hora_fim', 'valor_total']

    def create(self, validated_data):
        from datetime import timedelta
        servicos = validated_data.pop('servicos')
        duracao = sum(s.duracao_minutos for s in servicos)
        validated_data['data_hora_fim'] = validated_data['data_hora'] + timedelta(minutes=duracao)
        agendamento = Agendamento.objects.create(**validated_data)
        agendamento.servicos.set(servicos)
        agendamento.calcular_valor_total()
        return agendamento


class BloqueioAgendaSerializer(serializers.ModelSerializer):
    class Meta:
        model = BloqueioAgenda
        fields = '__all__'
