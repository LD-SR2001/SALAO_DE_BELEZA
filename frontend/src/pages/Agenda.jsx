import { useState, useEffect, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';
import { getAgendamentos, confirmarAgendamento, cancelarAgendamento, concluirAgendamento } from '../api';
import { format } from 'date-fns';
import ModalCancelamento from '../components/ModalCancelamento';

const STATUS_COLORS = {
  aguardando: '#f59e0b',
  confirmado: '#10b981',
  concluido: '#6366f1',
  cancelado: '#ef4444',
  nao_compareceu: '#9ca3af',
};

export default function Agenda() {
  const [agendamentos, setAgendamentos] = useState([]);
  const [selecionado, setSelecionado] = useState(null);
  const [cancelando, setCancelando] = useState(null);
  const [loading, setLoading] = useState(false);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getAgendamentos({ page_size: 200 });
      setAgendamentos(data.results || data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const eventos = agendamentos.map((ag) => ({
    id: ag.id,
    title: `${ag.cliente_detalhes?.nome} – ${ag.profissional_detalhes?.nome}`,
    start: ag.data_hora,
    end: ag.data_hora_fim,
    backgroundColor: STATUS_COLORS[ag.status] || '#6366f1',
    borderColor: STATUS_COLORS[ag.status] || '#6366f1',
    extendedProps: ag,
  }));

  const handleEventClick = (info) => {
    setSelecionado(info.event.extendedProps);
  };

  const handleAcao = async (acao) => {
    if (!selecionado) return;
    if (acao === 'cancelar') {
      setCancelando(selecionado);
      setSelecionado(null);
      return;
    }
    const fns = { confirmar: confirmarAgendamento, concluir: concluirAgendamento };
    await fns[acao](selecionado.id);
    setSelecionado(null);
    carregar();
  };

  const handleConfirmarCancelamento = async (motivo) => {
    await cancelarAgendamento(cancelando.id, motivo);
    setCancelando(null);
    carregar();
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Agenda</h1>
      </div>

      <div className="card">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          locale={ptBrLocale}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay',
          }}
          events={eventos}
          eventClick={handleEventClick}
          slotMinTime="07:00:00"
          slotMaxTime="21:00:00"
          height="auto"
          loading={() => loading}
        />
      </div>

      {selecionado && (
        <div className="modal-overlay" onClick={() => setSelecionado(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Detalhes do Agendamento</h3>
            <p><strong>Cliente:</strong> {selecionado.cliente_detalhes?.nome}</p>
            <p><strong>Profissional:</strong> {selecionado.profissional_detalhes?.nome}</p>
            <p><strong>Serviços:</strong> {selecionado.servicos_detalhes?.map((s) => s.nome).join(', ')}</p>
            <p>
              <strong>Data/Hora:</strong>{' '}
              {format(new Date(selecionado.data_hora), 'dd/MM/yyyy HH:mm')}
            </p>
            <p><strong>Status:</strong> {selecionado.status_display}</p>
            <p><strong>Valor:</strong> R$ {selecionado.valor_total}</p>
            {selecionado.observacoes && (
              <p><strong>Obs:</strong> {selecionado.observacoes}</p>
            )}
            {selecionado.motivo_cancelamento && (
              <p><strong>Motivo cancelamento:</strong> {selecionado.motivo_cancelamento}</p>
            )}
            <div className="modal-actions">
              {selecionado.status === 'aguardando' && (
                <button className="btn btn-success" onClick={() => handleAcao('confirmar')}>
                  Confirmar
                </button>
              )}
              {['aguardando', 'confirmado'].includes(selecionado.status) && (
                <>
                  <button className="btn btn-primary" onClick={() => handleAcao('concluir')}>
                    Concluir
                  </button>
                  <button className="btn btn-danger" onClick={() => handleAcao('cancelar')}>
                    Cancelar
                  </button>
                </>
              )}
              <button className="btn btn-secondary" onClick={() => setSelecionado(null)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {cancelando && (
        <ModalCancelamento
          agendamento={cancelando}
          onConfirmar={handleConfirmarCancelamento}
          onClose={() => setCancelando(null)}
        />
      )}
    </div>
  );
}
