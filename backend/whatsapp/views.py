from rest_framework import viewsets, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from .models import Conversa, Mensagem
from .serializers import ConversaSerializer, MensagemSerializer
from .evolution import evolution_client
from chatbot.services import processar_mensagem
import json
import logging

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([AllowAny])
def webhook_evolution(request):
    """
    Webhook que recebe eventos da Evolution API.
    Configure no painel da Evolution API para apontar para esta URL.
    """
    try:
        data = request.data
        evento = data.get('event', '')

        # Só processa mensagens recebidas
        if evento != 'messages.upsert':
            return Response({'status': 'ignored'})

        mensagem_data = data.get('data', {})

        # Ignora mensagens enviadas pelo próprio bot
        if mensagem_data.get('key', {}).get('fromMe', False):
            return Response({'status': 'ignored'})

        telefone = mensagem_data.get('key', {}).get('remoteJid', '').replace('@s.whatsapp.net', '')
        if not telefone:
            return Response({'status': 'ignored'})

        # Extrai texto da mensagem
        message = mensagem_data.get('message', {})
        texto = (
            message.get('conversation')
            or message.get('extendedTextMessage', {}).get('text')
            or ''
        )

        if not texto:
            return Response({'status': 'ignored'})

        logger.info(f'[Webhook] Mensagem de {telefone}: {texto[:50]}')

        # Processa com o chatbot
        resposta = processar_mensagem(telefone, texto)

        # Envia resposta pelo WhatsApp
        evolution_client.enviar_mensagem(telefone, resposta)

        return Response({'status': 'ok'})

    except Exception as e:
        logger.error(f'[Webhook] Erro: {e}', exc_info=True)
        return Response({'status': 'error'}, status=500)


class ConversaViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Conversa.objects.select_related('cliente').prefetch_related('mensagens').all()
    serializer_class = ConversaSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['status']
    search_fields = ['telefone', 'cliente__nome']
    ordering_fields = ['atualizada_em']


class MensagemViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Mensagem.objects.select_related('conversa').all()
    serializer_class = MensagemSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['conversa', 'direcao']
