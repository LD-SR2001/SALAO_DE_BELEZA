import { useState, useEffect, useCallback } from 'react';
import {
  getAgendamentos, getProfissionais, getServicos,
  confirmarAgendamento, cancelarAgendamento, concluirAgendamento,
  createAgendamento, getClientes, getHorariosDisponiveis,
} from '../api';
import api from '../api/client';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, Search, Filter, Check, X, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import ModalCancelamento from '../components/ModalCancelamento';

const STATUS = [
  { value: '', label: 'Todos' },
  { value: 'aguardando', label: 'Aguardando' },
  { value: 'confirmado', label: 'Confirmado' },
  { value: 'concluido', label: 'Concluído' },
  { value: 'cancelado', label: 'Cancelado' },
  { value: 'nao_compareceu', label: 'Não compareceu' },
];

// ─── Modal novo atendimento ────────────────────────────────────────────────
function ModalNovoAtendimento({ onSave, onClose }) {
  const [profissionais, setProfissionais] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const [buscaCliente, setBuscaCliente] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  const [form, setForm] = useState({
    cliente_id: '',
    profissional_id: '',
    servicos_ids: [],
    data: '',
    hora: '',
    observacoes: '',
  });

  // Duração total dos serviços selecionados
  const duracaoTotal = servicos
    .filter((s) => form.servicos_ids.includes(s.id))
    .reduce((acc, s) => acc + s.duracao_minutos, 0);

  useEffect(() => {
    Promise.all([
      api.get('/salao/profissionais/?ativo=true'),
      api.get('/salao/servicos/?ativo=true'),
    ]).then(([rp, rs]) => {
      setProfissionais(rp.data.results || rp.data);
      setServicos(rs.data.results || rs.data);
    });
  }, []);

  // Busca clientes com debounce
  useEffect(() => {
    const t = setTimeout(() => {
      if (buscaCliente.length < 2) { setClientes([]); return; }
      api.get(`/clientes/?search=${buscaCliente}&page_size=8`)
        .then((r) => setClientes(r.data.results || r.data));
    }, 300);
    return () => clearTimeout(t);
  }, [buscaCliente]);

  // Busca horários quando profissional + data + serviços estiverem preenchidos
  useEffect(() => {
    if (!form.profissional_id || !form.data || form.servicos_ids.length === 0) {
      setHorarios([]);
      return;
    }
    api.get(`/salao/profissionais/${form.profissional_id}/horarios_disponiveis/`, {
      params: { data: form.data, duracao_minutos: duracaoTotal || 60 },
    }).then((r) => setHorarios(r.data.horarios || []));
  }, [form.profissional_id, form.data, form.servicos_ids]);

  const toggleServico = (id) => {
    setForm((prev) => ({
      ...prev,
      servicos_ids: prev.servicos_ids.includes(id)
        ? prev.servicos_ids.filter((s) => s !== id)
        : [...prev.servicos_ids, id],
      hora: '', // reseta hora ao mudar serviços
    }));
  };

  // Agrupa serviços por especialidade
  const servicosPorEsp = servicos.reduce((acc, s) => {
    const key = s.especialidade_nome || 'Outros';
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});

  const valorTotal = servicos
    .filter((s) => form.servicos_ids.includes(s.id))
    .reduce((acc, s) => acc + parseFloat(s.preco), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    if (!form.cliente_id) { setErro('Selecione um cliente.'); return; }
    if (form.servicos_ids.length === 0) { setErro('Selecione ao menos um serviço.'); return; }
    if (!form.hora) { setErro('Selecione um horário.'); return; }

    setSalvando(true);
    try {
      await createAgendamento({
        cliente: form.cliente_id,
        profissional: form.profissional_id,
        servicos_ids: form.servicos_ids,
        data_hora: `${form.data}T${form.hora}:00`,
        observacoes: form.observacoes,
      });
      onSave();
    } catch (e) {
      setErro(e.response?.data?.detail || 'Erro ao criar agendamento.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--lg" onClick={(e) => e.stopPropagation()}>
        <h3>Novo Atendimento</h3>
        <form onSubmit={handleSubmit}>
          {erro && <div className="alert alert-error" style={{ marginBottom: 14 }}>{erro}</div>}

          {/* Cliente */}
          <div className="form-group">
            <label>Cliente</label>
            {form.cliente_id ? (
              <div className="cliente-selecionado">
                <span>{clientes.find((c) => c.id === form.cliente_id)?.nome || 'Cliente selecionado'}</span>
                <button type="button" className="btn-icon btn-icon--danger"
                  onClick={() => { setForm((p) => ({ ...p, cliente_id: '' })); setBuscaCliente(''); }}>
                  <X size={14} />
                </button>
              </div>
            ) : (
              <>
                <input
                  placeholder="Buscar por nome ou telefone..."
                  value={buscaCliente}
                  onChange={(e) => setBuscaCliente(e.target.value)}
                />
                {clientes.length > 0 && (
                  <div className="dropdown-lista">
                    {clientes.map((c) => (
                      <button key={c.id} type="button" className="dropdown-item"
                        onClick={() => { setForm((p) => ({ ...p, cliente_id: c.id })); setBuscaCliente(c.nome); setClientes([]); }}>
                        <strong>{c.nome}</strong> <span>{c.telefone}</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Profissional */}
          <div className="form-group">
            <label>Profissional</label>
            <select value={form.profissional_id}
              onChange={(e) => setForm((p) => ({ ...p, profissional_id: e.target.value, hora: '' }))} required>
              <option value="">Selecione...</option>
              {profissionais.map((p) => (
                <option key={p.id} value={p.id}>{p.nome}</option>
              ))}
            </select>
          </div>

          {/* Serviços */}
          <div className="form-group">
            <label>Serviços {form.servicos_ids.length > 0 && <span className="label-info">— {duracaoTotal} min · R$ {valorTotal.toFixed(2)}</span>}</label>
            <div className="servicos-grid">
              {Object.entries(servicosPorEsp).map(([esp, lista]) => (
                <div key={esp} className="servicos-grupo">
                  <p className="servicos-grupo-titulo">{esp}</p>
                  {lista.map((s) => {
                    const sel = form.servicos_ids.includes(s.id);
                    return (
                      <button key={s.id} type="button"
                        className={`servico-chip ${sel ? 'servico-chip--ativo' : ''}`}
                        onClick={() => toggleServico(s.id)}>
                        {sel && <Check size={11} />}
                        {s.nome} <span>R$ {s.preco}</span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Data e Hora */}
          <div className="form-row">
            <div className="form-group">
              <label>Data</label>
              <input type="date" value={form.data}
                onChange={(e) => setForm((p) => ({ ...p, data: e.target.value, hora: '' }))}
                min={new Date().toISOString().split('T')[0]} required />
            </div>
            <div className="form-group">
              <label>Horário</label>
              {horarios.length > 0 ? (
                <div className="horarios-grid">
                  {horarios.map((h) => (
                    <button key={h} type="button"
                      className={`horario-btn ${form.hora === h ? 'horario-btn--ativo' : ''}`}
                      onClick={() => setForm((p) => ({ ...p, hora: h }))}>
                      {h}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="horarios-vazio">
                  {!form.profissional_id || !form.data || form.servicos_ids.length === 0
                    ? 'Selecione profissional, serviço e data'
                    : 'Nenhum horário disponível nesta data'}
                </p>
              )}
            </div>
          </div>

          <div className="form-group">
            <label>Observações</label>
            <textarea value={form.observacoes}
              onChange={(e) => setForm((p) => ({ ...p, observacoes: e.target.value }))}
              rows={2} placeholder="Opcional..." />
          </div>

          <div className="modal-actions">
            <button type="submit" className="btn btn-primary" disabled={salvando}>
              {salvando ? 'Salvando...' : 'Criar atendimento'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Linha da tabela ───────────────────────────────────────────────────────
function LinhaAtendimento({ ag, onAcao }) {
  const data = parseISO(ag.data_hora);

  return (
    <tr>
      <td>
        <div className="at-data">
          <strong>{format(data, 'dd/MM/yyyy')}</strong>
          <span>{format(data, 'HH:mm')}</span>
        </div>
      </td>
      <td>
        <div className="at-cliente">
          <strong>{ag.cliente_detalhes?.nome}</strong>
          <span>{ag.cliente_detalhes?.telefone}</span>
        </div>
      </td>
      <td>{ag.profissional_detalhes?.nome}</td>
      <td>
        <div className="at-servicos">
          {ag.servicos_detalhes?.map((s) => (
            <span key={s.id} className="at-servico-tag">{s.nome}</span>
          ))}
        </div>
      </td>
      <td>R$ {parseFloat(ag.valor_total).toFixed(2)}</td>
      <td><span className={`badge badge-${ag.status}`}>{ag.status_display}</span></td>
      <td>
        <div className="at-acoes">
          {ag.status === 'aguardando' && (
            <button className="at-btn at-btn--confirmar" title="Confirmar" onClick={() => onAcao('confirmar', ag.id)}>
              <Check size={13} /> Confirmar
            </button>
          )}
          {['aguardando', 'confirmado'].includes(ag.status) && (
            <>
              <button className="at-btn at-btn--concluir" title="Concluir" onClick={() => onAcao('concluir', ag.id)}>
                <Clock size={13} /> Concluir
              </button>
              <button className="at-btn at-btn--cancelar" title="Cancelar" onClick={() => onAcao('cancelar', ag.id)}>
                <X size={13} /> Cancelar
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

// ─── Página principal ──────────────────────────────────────────────────────
export default function Atendimentos() {
  const [atendimentos, setAtendimentos] = useState([]);
  const [profissionais, setProfissionais] = useState([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [modalAberto, setModalAberto] = useState(false);
  const [cancelando, setCancelando] = useState(null); // agendamento sendo cancelado
  const [carregando, setCarregando] = useState(false);

  const [filtros, setFiltros] = useState({
    status: '',
    profissional: '',
    data_inicio: '',
    data_fim: '',
    busca: '',
  });

  const POR_PAGINA = 15;

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const params = {
        page: pagina,
        page_size: POR_PAGINA,
        ordering: '-data_hora',
      };
      if (filtros.status) params.status = filtros.status;
      if (filtros.profissional) params.profissional = filtros.profissional;
      if (filtros.data_inicio) params.data_hora__date__gte = filtros.data_inicio;
      if (filtros.data_fim) params.data_hora__date__lte = filtros.data_fim;
      if (filtros.busca) params.search = filtros.busca;

      const { data } = await getAgendamentos(params);
      setAtendimentos(data.results || data);
      setTotal(data.count || (data.results || data).length);
    } finally {
      setCarregando(false);
    }
  }, [pagina, filtros]);

  useEffect(() => { carregar(); }, [carregar]);

  useEffect(() => {
    api.get('/salao/profissionais/?ativo=true')
      .then((r) => setProfissionais(r.data.results || r.data));
  }, []);

  const handleAcao = async (acao, id) => {
    if (acao === 'cancelar') {
      const ag = atendimentos.find((a) => a.id === id);
      setCancelando(ag);
      return;
    }
    const fns = { confirmar: confirmarAgendamento, concluir: concluirAgendamento };
    await fns[acao](id);
    carregar();
  };

  const handleConfirmarCancelamento = async (motivo) => {
    await cancelarAgendamento(cancelando.id, motivo);
    setCancelando(null);
    carregar();
  };

  const totalPaginas = Math.ceil(total / POR_PAGINA);

  const handleFiltro = (campo, valor) => {
    setFiltros((prev) => ({ ...prev, [campo]: valor }));
    setPagina(1);
  };

  // Totais rápidos dos itens na página atual
  const totalPagina = atendimentos
    .filter((a) => !['cancelado', 'nao_compareceu'].includes(a.status))
    .reduce((acc, a) => acc + parseFloat(a.valor_total || 0), 0);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Atendimentos</h1>
          <p className="page-subtitle">{total} registro{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModalAberto(true)}>
          <Plus size={16} /> Novo atendimento
        </button>
      </div>

      {/* Filtros */}
      <div className="card filtros-bar">
        <div className="filtros-row">
          <div className="filtro-busca">
            <Search size={15} />
            <input
              placeholder="Buscar cliente ou profissional..."
              value={filtros.busca}
              onChange={(e) => handleFiltro('busca', e.target.value)}
            />
          </div>

          <select value={filtros.status} onChange={(e) => handleFiltro('status', e.target.value)}>
            {STATUS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>

          <select value={filtros.profissional} onChange={(e) => handleFiltro('profissional', e.target.value)}>
            <option value="">Todas as profissionais</option>
            {profissionais.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>

          <div className="filtro-datas">
            <input type="date" value={filtros.data_inicio}
              onChange={(e) => handleFiltro('data_inicio', e.target.value)} />
            <span>até</span>
            <input type="date" value={filtros.data_fim}
              onChange={(e) => handleFiltro('data_fim', e.target.value)} />
          </div>

          {(filtros.status || filtros.profissional || filtros.data_inicio || filtros.data_fim || filtros.busca) && (
            <button className="btn btn-secondary" onClick={() => {
              setFiltros({ status: '', profissional: '', data_inicio: '', data_fim: '', busca: '' });
              setPagina(1);
            }}>
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* Tabela */}
      <div className="card">
        {carregando ? (
          <p className="empty-state">Carregando...</p>
        ) : atendimentos.length === 0 ? (
          <p className="empty-state">Nenhum atendimento encontrado.</p>
        ) : (
          <>
            <table className="table table--atendimentos">
              <thead>
                <tr>
                  <th>Data / Hora</th>
                  <th>Cliente</th>
                  <th>Profissional</th>
                  <th>Serviços</th>
                  <th>Valor</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {atendimentos.map((ag) => (
                  <LinhaAtendimento key={ag.id} ag={ag} onAcao={handleAcao} />
                ))}
              </tbody>
            </table>

            {/* Rodapé da tabela */}
            <div className="table-footer">
              <span className="table-total">
                Subtotal desta página (excl. cancelados): <strong>R$ {totalPagina.toFixed(2)}</strong>
              </span>
              <div className="paginacao">
                <button className="btn-icon" disabled={pagina === 1} onClick={() => setPagina((p) => p - 1)}>
                  <ChevronLeft size={16} />
                </button>
                <span>Página {pagina} de {totalPaginas || 1}</span>
                <button className="btn-icon" disabled={pagina >= totalPaginas} onClick={() => setPagina((p) => p + 1)}>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {modalAberto && (
        <ModalNovoAtendimento
          onSave={() => { setModalAberto(false); carregar(); }}
          onClose={() => setModalAberto(false)}
        />
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
