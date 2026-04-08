from rest_framework.routers import DefaultRouter
from .views import AgendamentoViewSet, BloqueioAgendaViewSet

router = DefaultRouter()
router.register('agendamentos', AgendamentoViewSet)
router.register('bloqueios', BloqueioAgendaViewSet)

urlpatterns = router.urls
