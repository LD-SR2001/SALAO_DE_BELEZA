from rest_framework import serializers
from .models import Especialidade, Profissional, PortfolioItem, HorarioTrabalho, Servico, ConfiguracaoSalao


class FlexPrimaryKeyRelatedField(serializers.PrimaryKeyRelatedField):
    """Aceita IDs enviados como string (FormData/multipart) ou inteiro."""
    def to_internal_value(self, data):
        try:
            return super().to_internal_value(int(data))
        except (ValueError, TypeError):
            return super().to_internal_value(data)


class EspecialidadeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Especialidade
        fields = '__all__'


class HorarioTrabalhoSerializer(serializers.ModelSerializer):
    dia_semana_display = serializers.CharField(source='get_dia_semana_display', read_only=True)

    class Meta:
        model = HorarioTrabalho
        fields = '__all__'


class PortfolioItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = PortfolioItem
        fields = ['id', 'profissional', 'foto', 'descricao', 'ordem', 'criado_em']


class ProfissionalSerializer(serializers.ModelSerializer):
    especialidades = EspecialidadeSerializer(many=True, read_only=True)
    especialidades_ids = FlexPrimaryKeyRelatedField(
        many=True, queryset=Especialidade.objects.all(),
        write_only=True, source='especialidades'
    )
    horarios = HorarioTrabalhoSerializer(many=True, read_only=True)
    foto_url = serializers.SerializerMethodField()

    class Meta:
        model = Profissional
        fields = [
            'id', 'nome', 'telefone', 'descricao',
            'especialidades', 'especialidades_ids',
            'ativo', 'foto', 'foto_url', 'horarios', 'criado_em',
        ]

    def get_foto_url(self, obj):
        if obj.foto:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.foto.url)
            return obj.foto.url
        return None

    def update(self, instance, validated_data):
        especialidades = validated_data.pop('especialidades', None)
        instance = super().update(instance, validated_data)
        if especialidades is not None:
            instance.especialidades.set(especialidades)
        return instance

    def create(self, validated_data):
        especialidades = validated_data.pop('especialidades', [])
        instance = super().create(validated_data)
        instance.especialidades.set(especialidades)
        return instance


class ServicoSerializer(serializers.ModelSerializer):
    especialidade_nome = serializers.CharField(source='especialidade.nome', read_only=True)
    especialidade_tipo = serializers.CharField(source='especialidade.tipo', read_only=True)

    class Meta:
        model = Servico
        fields = '__all__'


class ConfiguracaoSalaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConfiguracaoSalao
        fields = '__all__'
