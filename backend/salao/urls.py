from rest_framework.routers import DefaultRouter
from .views import (
    EspecialidadeViewSet, ProfissionalViewSet, PortfolioItemViewSet,
    HorarioTrabalhoViewSet, ServicoViewSet, ConfiguracaoSalaoViewSet,
)

router = DefaultRouter()
router.register('especialidades', EspecialidadeViewSet)
router.register('profissionais', ProfissionalViewSet)
router.register('portfolio', PortfolioItemViewSet)
router.register('horarios-trabalho', HorarioTrabalhoViewSet)
router.register('servicos', ServicoViewSet)
router.register('configuracao', ConfiguracaoSalaoViewSet)

urlpatterns = router.urls
