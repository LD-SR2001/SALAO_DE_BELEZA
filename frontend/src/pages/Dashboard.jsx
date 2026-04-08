import { useEffect, useState } from 'react';
import { getDashboard, getAgendamentosHoje } from '../api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, CheckCircle, Clock, Users } from 'lucide-react';

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className={`stat-card stat-card--${color}`}>
      <div className="stat-icon">
        <Icon size={22} />
      </div>
      <div>
        <p className="stat-label">{label}</p>
        <p className="stat-value">{value}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [agendamentos, setAgendamentos] = useState([]);
  const hoje = format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR });

  useEffect(() => {
    getDashboard().then((r) => setStats(r.data));
    getAgendamentosHoje().then((r) => setAgendamentos(r.data));
  }, []);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p className="page-subtitle">{hoje}</p>
      </div>

      <div className="stats-grid">
        <StatCard
          icon={Calendar}
          label="Agendamentos hoje"
          value={stats?.total_hoje ?? '–'}
          color="blue"
        />
        <StatCard
          icon={CheckCircle}
          label="Confirmados"
          value={stats?.confirmados_hoje ?? '–'}
          color="green"
        />
        <StatCard
          icon={Clock}
          label="Aguardando"
          value={stats?.aguardando_hoje ?? '–'}
          color="yellow"
        />
      </div>

      <div className="card">
        <h2 className="card-title">Agenda de hoje</h2>
        {agendamentos.length === 0 ? (
          <p className="empty-state">Nenhum agendamento para hoje.</p>
        ) : (
          <div className="agenda-lista">
            {agendamentos.map((ag) => (
              <div key={ag.id} className={`agenda-item status-${ag.status}`}>
                <div className="agenda-hora">
                  {format(new Date(ag.data_hora), 'HH:mm')}
                </div>
                <div className="agenda-info">
                  <strong>{ag.cliente_detalhes?.nome}</strong>
                  <span>{ag.servicos_detalhes?.map((s) => s.nome).join(', ')}</span>
                  <span className="profissional">{ag.profissional_detalhes?.nome}</span>
                </div>
                <span className={`badge badge-${ag.status}`}>{ag.status_display}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
