from rest_framework import viewsets, permissions, parsers
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Especialidade, Profissional, PortfolioItem, HorarioTrabalho, Servico, ConfiguracaoSalao
from .serializers import (
    EspecialidadeSerializer, ProfissionalSerializer, PortfolioItemSerializer,
    HorarioTrabalhoSerializer, ServicoSerializer, ConfiguracaoSalaoSerializer,
)


class EspecialidadeViewSet(viewsets.ModelViewSet):
    queryset = Especialidade.objects.all()
    serializer_class = EspecialidadeSerializer
    permission_classes = [permissions.IsAuthenticated]


class ProfissionalViewSet(viewsets.ModelViewSet):
    queryset = Profissional.objects.prefetch_related('especialidades', 'horarios').all()
    serializer_class = ProfissionalSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]
    filterset_fields = ['ativo']
    search_fields = ['nome']

    def get_serializer_context(self):
        return {**super().get_serializer_context(), 'request': self.request}

    @action(detail=False, methods=['get'])
    def ativos(self, request):
        profissionais = self.queryset.filter(ativo=True)
        serializer = self.get_serializer(profissionais, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def horarios_disponiveis(self, request, pk=None):
        from agenda.services import AgendaService
        profissional = self.get_object()
        data = request.query_params.get('data')
        if not data:
            return Response({'error': 'Parâmetro data é obrigatório (YYYY-MM-DD)'}, status=400)
        horarios = AgendaService.horarios_disponiveis(profissional, data)
        return Response({'horarios': horarios})


class PortfolioItemViewSet(viewsets.ModelViewSet):
    queryset = PortfolioItem.objects.select_related('profissional').all()
    serializer_class = PortfolioItemSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]
    filterset_fields = ['profissional']


class HorarioTrabalhoViewSet(viewsets.ModelViewSet):
    queryset = HorarioTrabalho.objects.select_related('profissional').all()
    serializer_class = HorarioTrabalhoSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['profissional', 'ativo']


class ServicoViewSet(viewsets.ModelViewSet):
    queryset = Servico.objects.select_related('especialidade').all()
    serializer_class = ServicoSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['ativo', 'especialidade', 'especialidade__tipo']
    search_fields = ['nome']

    @action(detail=False, methods=['get'])
    def por_especialidade(self, request):
        tipo = request.query_params.get('tipo')
        qs = self.queryset.filter(ativo=True)
        if tipo:
            qs = qs.filter(especialidade__tipo=tipo)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)


class ConfiguracaoSalaoViewSet(viewsets.ModelViewSet):
    queryset = ConfiguracaoSalao.objects.all()
    serializer_class = ConfiguracaoSalaoSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'])
    def atual(self, request):
        config = ConfiguracaoSalao.objects.first()
        if not config:
            return Response({'detail': 'Nenhuma configuração cadastrada.'}, status=404)
        return Response(ConfiguracaoSalaoSerializer(config).data)
