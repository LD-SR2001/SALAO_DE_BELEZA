from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import webhook_evolution, ConversaViewSet, MensagemViewSet

router = DefaultRouter()
router.register('conversas', ConversaViewSet)
router.register('mensagens', MensagemViewSet)

urlpatterns = [
    path('webhook/', webhook_evolution, name='webhook-evolution'),
] + router.urls
