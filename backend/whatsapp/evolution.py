import requests
from django.conf import settings


class EvolutionAPIClient:
    """Cliente para a Evolution API (WhatsApp)."""

    def __init__(self):
        self.base_url = settings.EVOLUTION_API_URL.rstrip('/')
        self.api_key = settings.EVOLUTION_API_KEY
        self.instance = settings.EVOLUTION_INSTANCE

    def _headers(self) -> dict:
        return {
            'apikey': self.api_key,
            'Content-Type': 'application/json',
        }

    def enviar_mensagem(self, telefone: str, mensagem: str) -> dict:
        """Envia mensagem de texto para um número."""
        # Garante formato E.164 sem + (55119...)
        numero = telefone.replace('+', '').replace('-', '').replace(' ', '')

        url = f'{self.base_url}/message/sendText/{self.instance}'
        payload = {
            'number': numero,
            'text': mensagem,
        }
        try:
            response = requests.post(url, json=payload, headers=self._headers(), timeout=10)
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            print(f'[Evolution API] Erro ao enviar mensagem: {e}')
            return {'error': str(e)}

    def verificar_instancia(self) -> bool:
        """Verifica se a instância está conectada."""
        url = f'{self.base_url}/instance/connectionState/{self.instance}'
        try:
            response = requests.get(url, headers=self._headers(), timeout=5)
            data = response.json()
            return data.get('instance', {}).get('state') == 'open'
        except Exception:
            return False


evolution_client = EvolutionAPIClient()
