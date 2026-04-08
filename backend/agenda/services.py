from datetime import datetime, timedelta, date, time
from django.utils import timezone
from django.utils.timezone import make_aware
import pytz

TIMEZONE = pytz.timezone('America/Sao_Paulo')


class AgendaService:

    @staticmethod
    def horarios_disponiveis(profissional, data_str: str, duracao_minutos: int = 60) -> list[str]:
        """
        Retorna lista de horários disponíveis (strings HH:MM) para um profissional
        em uma data específica (YYYY-MM-DD).
        """
        from .models import Agendamento, BloqueioAgenda
        from salao.models import HorarioTrabalho

        try:
            data = date.fromisoformat(data_str)
        except ValueError:
            return []

        dia_semana = data.weekday()  # 0=segunda, 6=domingo

        horario_trabalho = HorarioTrabalho.objects.filter(
            profissional=profissional,
            dia_semana=dia_semana,
            ativo=True,
        ).first()

        if not horario_trabalho:
            return []

        # Gera slots de 30 em 30 minutos dentro do horário de trabalho
        slots = []
        atual = datetime.combine(data, horario_trabalho.hora_inicio)
        fim_expediente = datetime.combine(data, horario_trabalho.hora_fim)

        while atual + timedelta(minutes=duracao_minutos) <= fim_expediente:
            slots.append(atual)
            atual += timedelta(minutes=30)

        # Remove slots já agendados
        agendamentos_dia = Agendamento.objects.filter(
            profissional=profissional,
            data_hora__date=data,
            status__in=[Agendamento.AGUARDANDO, Agendamento.CONFIRMADO],
        )

        bloqueios = BloqueioAgenda.objects.filter(
            profissional=profissional,
            data_hora_inicio__date=data,
        )

        slots_livres = []
        for slot in slots:
            slot_aware = make_aware(slot, TIMEZONE)
            slot_fim = slot_aware + timedelta(minutes=duracao_minutos)
            ocupado = False

            for ag in agendamentos_dia:
                if ag.data_hora < slot_fim and ag.data_hora_fim > slot_aware:
                    ocupado = True
                    break

            if not ocupado:
                for bloqueio in bloqueios:
                    if bloqueio.data_hora_inicio < slot_fim and bloqueio.data_hora_fim > slot_aware:
                        ocupado = True
                        break

            if not ocupado:
                # Não permite agendamento com menos de 2h de antecedência
                agora = timezone.now()
                if slot_aware > agora + timedelta(hours=2):
                    slots_livres.append(slot.strftime('%H:%M'))

        return slots_livres

    @staticmethod
    def criar_agendamento(cliente, profissional, servicos: list, data_str: str, hora_str: str):
        """
        Cria um agendamento validando disponibilidade.
        Retorna (agendamento, erro).
        """
        from .models import Agendamento

        try:
            data_hora = make_aware(
                datetime.strptime(f'{data_str} {hora_str}', '%Y-%m-%d %H:%M'),
                TIMEZONE,
            )
        except ValueError:
            return None, 'Data ou hora inválida.'

        duracao = sum(s.duracao_minutos for s in servicos)
        data_hora_fim = data_hora + timedelta(minutes=duracao)

        # Verifica conflito
        conflito = Agendamento.objects.filter(
            profissional=profissional,
            status__in=[Agendamento.AGUARDANDO, Agendamento.CONFIRMADO],
            data_hora__lt=data_hora_fim,
            data_hora_fim__gt=data_hora,
        ).exists()

        if conflito:
            return None, 'Horário não disponível para este profissional.'

        agendamento = Agendamento.objects.create(
            cliente=cliente,
            profissional=profissional,
            data_hora=data_hora,
            data_hora_fim=data_hora_fim,
            criado_via_whatsapp=True,
        )
        agendamento.servicos.set(servicos)
        agendamento.calcular_valor_total()

        return agendamento, None

    @staticmethod
    def proximos_agendamentos(profissional=None, data=None):
        from .models import Agendamento
        qs = Agendamento.objects.filter(
            status__in=[Agendamento.AGUARDANDO, Agendamento.CONFIRMADO],
            data_hora__gte=timezone.now(),
        ).select_related('cliente', 'profissional').prefetch_related('servicos')

        if profissional:
            qs = qs.filter(profissional=profissional)
        if data:
            qs = qs.filter(data_hora__date=data)

        return qs.order_by('data_hora')
