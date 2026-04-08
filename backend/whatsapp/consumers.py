import json
from channels.generic.websocket import AsyncWebsocketConsumer


class ConversaConsumer(AsyncWebsocketConsumer):
    """WebSocket para atualização em tempo real das conversas no painel."""

    GROUP_NAME = 'conversas'

    async def connect(self):
        await self.channel_layer.group_add(self.GROUP_NAME, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.GROUP_NAME, self.channel_name)

    async def nova_mensagem(self, event):
        """Enviado quando chega nova mensagem de cliente."""
        await self.send(text_data=json.dumps({
            'tipo': 'nova_mensagem',
            'conversa_id': event['conversa_id'],
            'telefone': event['telefone'],
            'mensagem': event['mensagem'],
        }))

    async def novo_agendamento(self, event):
        """Enviado quando um agendamento é criado pelo chatbot."""
        await self.send(text_data=json.dumps({
            'tipo': 'novo_agendamento',
            'agendamento_id': event['agendamento_id'],
        }))
