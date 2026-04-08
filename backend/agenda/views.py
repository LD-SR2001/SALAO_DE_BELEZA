from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from .models import Agendamento, BloqueioAgenda
from .serializers import AgendamentoSerializer, AgendamentoCriarSerializer, BloqueioAgendaSerializer
from .services import AgendaService


class AgendamentoViewSet(viewsets.ModelViewSet):
    queryset = Agendamento.objects.select_related(
        'cliente', 'profissional'
    ).prefetch_related('servicos').all()
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = {
        'status': ['exact'],
        'profissional': ['exact'],
        'cliente': ['exact'],
        'data_hora': ['date__gte', 'date__lte', 'date'],
    }
    search_fields = ['cliente__nome', 'profissional__nome']
    ordering_fields = ['data_hora', 'criado_em']

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return AgendamentoCriarSerializer
        return AgendamentoSerializer

    @action(detail=False, methods=['get'])
    def hoje(self, request):
        hoje = timezone.now().date()
        agendamentos = self.queryset.filter(data_hora__date=hoje).order_by('data_hora')
        serializer = AgendamentoSerializer(agendamentos, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def por_data(self, request):
        data = request.query_params.get('data')
        profissional_id = request.query_params.get('profissional')
        if not data:
            return Response({'error': 'Parâmetro data é obrigatório (YYYY-MM-DD)'}, status=400)
        qs = self.queryset.filter(data_hora__date=data)
        if profissional_id:
            qs = qs.filter(profissional_id=profissional_id)
        serializer = AgendamentoSerializer(qs.order_by('data_hora'), many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def confirmar(self, request, pk=None):
        agendamento = self.get_object()
        agendamento.status = Agendamento.CONFIRMADO
        agendamento.save()
        return Response({'status': 'Agendamento confirmado.'})

    @action(detail=True, methods=['post'])
    def cancelar(self, request, pk=None):
        motivo = request.data.get('motivo', '').strip()
        if not motivo:
            return Response(
                {'motivo': 'O motivo do cancelamento é obrigatório.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        agendamento = self.get_object()
        agendamento.status = Agendamento.CANCELADO
        agendamento.motivo_cancelamento = motivo
        agendamento.save(update_fields=['status', 'motivo_cancelamento', 'atualizado_em'])
        from notificacoes.tasks import notificar_cancelamento
        notificar_cancelamento.delay(agendamento.id)
        return Response({'status': 'Agendamento cancelado.'})

    @action(detail=True, methods=['post'])
    def concluir(self, request, pk=None):
        agendamento = self.get_object()
        agendamento.status = Agendamento.CONCLUIDO
        agendamento.save()
        return Response({'status': 'Agendamento concluído.'})

    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        hoje = timezone.now().date()
        total_hoje = self.queryset.filter(data_hora__date=hoje).count()
        confirmados_hoje = self.queryset.filter(
            data_hora__date=hoje, status=Agendamento.CONFIRMADO
        ).count()
        aguardando_hoje = self.queryset.filter(
            data_hora__date=hoje, status=Agendamento.AGUARDANDO
        ).count()
        return Response({
            'total_hoje': total_hoje,
            'confirmados_hoje': confirmados_hoje,
            'aguardando_hoje': aguardando_hoje,
        })


class BloqueioAgendaViewSet(viewsets.ModelViewSet):
    queryset = BloqueioAgenda.objects.select_related('profissional').all()
    serializer_class = BloqueioAgendaSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['profissional']
