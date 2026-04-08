from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Cliente
from .serializers import ClienteSerializer


class ClienteViewSet(viewsets.ModelViewSet):
    queryset = Cliente.objects.all()
    serializer_class = ClienteSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['ativo']
    search_fields = ['nome', 'telefone', 'email']
    ordering_fields = ['nome', 'criado_em']

    @action(detail=True, methods=['get'])
    def historico(self, request, pk=None):
        from agenda.models import Agendamento
        from agenda.serializers import AgendamentoSerializer
        cliente = self.get_object()
        agendamentos = Agendamento.objects.filter(cliente=cliente).order_by('-data_hora')
        serializer = AgendamentoSerializer(agendamentos, many=True)
        return Response(serializer.data)
