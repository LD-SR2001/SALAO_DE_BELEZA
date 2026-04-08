import { useState, useEffect, useCallback } from 'react';
import { getClientes, getHistoricoCliente, createCliente, updateCliente } from '../api';
import { format } from 'date-fns';
import { Search, Plus, Pencil, Phone, Mail, MessageCircle, X } from 'lucide-react';

// ─── Modal criar/editar cliente ────────────────────────────────────────────
function ModalCliente({ cliente, onSave, onClose }) {
  const [form, setForm] = useState({
    nome: cliente?.nome || '',
    telefone: cliente?.telefone || '',
    email: cliente?.email || '',
    data_nascimento: cliente?.data_nascimento || '',
    observacoes: cliente?.observacoes || '',
    ativo: cliente?.ativo ?? true,
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setSalvando(true);
    try {
      if (cliente) {
        await updateCliente(cliente.id, form);
      } else {
        await createCliente(form);
      }
      onSave();
    } catch (err) {
      const data = err.response?.data;
      if (data?.telefone) setErro(`Telefone: ${data.telefone[0]}`);
      else setErro('Erro ao salvar cliente. Verifique os dados.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{cliente ? 'Editar Cliente' : 'Novo Cliente'}</h3>
        <form onSubmit={handleSubmit}>
          {erro && <div className="alert alert-error" style={{ marginBottom: 14 }}>{erro}</div>}

          <div className="form-row">
            <div className="form-group">
              <label>Nome *</label>
              <input name="nome" value={form.nome} onChange={handleChange} required autoFocus />
            </div>
            <div className="form-group">
              <label>Telefone / WhatsApp *</label>
              <input
                name="telefone"
                value={form.telefone}
                onChange={handleChange}
                placeholder="5511999990000"
                required
              />
              <span className="input-hint">Formato internacional: 55 + DDD + número</span>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>E-mail</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Data de nascimento</label>
              <input type="date" name="data_nascimento" value={form.data_nascimento} onChange={handleChange} />
            </div>
          </div>

          <div className="form-group">
            <label>Observações</label>
            <textarea name="observacoes" value={form.observacoes} onChange={handleChange} rows={2}
              placeholder="Alergias, preferências, observações gerais..." />
          </div>

          {cliente && (
            <div className="form-check">
              <input type="checkbox" id="ativo" name="ativo" checked={form.ativo} onChange={handleChange} />
              <label htmlFor="ativo">Cliente ativo</label>
            </div>
          )}

          <div className="modal-actions">
            <button type="submit" className="btn btn-primary" disabled={salvando}>
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Painel lateral de detalhes ────────────────────────────────────────────
function DetalheCliente({ cliente, historico, onEditar, onFechar }) {
  const temNomePadrao = cliente.nome === cliente.telefone ||
    cliente.nome.replace(/\D/g, '').length > 6;

  return (
    <div className="card cliente-detalhe">
      <div className="cliente-detalhe-header">
        <div className="cliente-avatar">
          {cliente.nome.charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <h3>{cliente.nome}</h3>
          {temNomePadrao && (
            <span className="alerta-nome">⚠ Nome não identificado ainda</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button className="btn-icon" title="Editar" onClick={onEditar}>
            <Pencil size={15} />
          </button>
          <button className="btn-icon" title="Fechar" onClick={onFechar}>
            <X size={15} />
          </button>
        </div>
      </div>

      <div className="cliente-contatos">
        <div className="contato-item">
          <Phone size={13} />
          <span>{cliente.telefone}</span>
        </div>
        {cliente.email && (
          <div className="contato-item">
            <Mail size={13} />
            <span>{cliente.email}</span>
          </div>
        )}
        {cliente.data_nascimento && (
          <div className="contato-item">
            <span>🎂</span>
            <span>{format(new Date(cliente.data_nascimento + 'T00:00:00'), 'dd/MM/yyyy')}</span>
          </div>
        )}
      </div>

      {cliente.observacoes && (
        <div className="cliente-obs">
          <p>{cliente.observacoes}</p>
        </div>
      )}

      <div className="cliente-stats">
        <div className="cliente-stat">
          <strong>{cliente.total_agendamentos}</strong>
          <span>atendimentos</span>
        </div>
        <div className="cliente-stat">
          <strong>{historico.filter(a => a.status === 'concluido').length}</strong>
          <span>concluídos</span>
        </div>
        <div className="cliente-stat">
          <strong>
            R$ {historico
              .filter(a => a.status === 'concluido')
              .reduce((acc, a) => acc + parseFloat(a.valor_total || 0), 0)
              .toFixed(0)}
          </strong>
          <span>total gasto</span>
        </div>
      </div>

      <h4 className="historico-titulo">Histórico</h4>
      {historico.length === 0 ? (
        <p className="empty-state">Nenhum agendamento ainda.</p>
      ) : (
        <div className="historico-lista">
          {historico.map((ag) => (
            <div key={ag.id} className="historico-item">
              <div className="historico-data">
                <strong>{format(new Date(ag.data_hora), 'dd/MM/yy')}</strong>
                <span>{format(new Date(ag.data_hora), 'HH:mm')}</span>
              </div>
              <div className="historico-info">
                <span>{ag.servicos_detalhes?.map((s) => s.nome).join(', ')}</span>
                <span className="historico-prof">{ag.profissional_detalhes?.nome}</span>
              </div>
              <span className={`badge badge-${ag.status}`}>{ag.status_display}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Página principal ──────────────────────────────────────────────────────
export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [total, setTotal] = useState(0);
  const [busca, setBusca] = useState('');
  const [selecionado, setSelecionado] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState(null);

  const carregar = useCallback(() => {
    getClientes({ search: busca, page_size: 50, ordering: 'nome' }).then((r) => {
      const lista = r.data.results || r.data;
      setClientes(lista);
      setTotal(r.data.count || lista.length);
    });
  }, [busca]);

  useEffect(() => {
    const t = setTimeout(carregar, 300);
    return () => clearTimeout(t);
  }, [carregar]);

  const abrirCliente = async (cliente) => {
    setSelecionado(cliente);
    const { data } = await getHistoricoCliente(cliente.id);
    setHistorico(data);
  };

  const handleSave = () => {
    setModalAberto(false);
    setEditando(null);
    carregar();
    // Recarrega detalhes se estava aberto
    if (selecionado) {
      getClientes({ search: '', page_size: 1 }); // força refresh
      getHistoricoCliente(selecionado.id).then(({ data }) => setHistorico(data));
    }
  };

  const abrirEditar = (cliente) => {
    setEditando(cliente);
    setModalAberto(true);
  };

  // Indica clientes sem nome real (criados automaticamente via WhatsApp)
  const semNome = (c) => c.nome === c.telefone || c.nome.replace(/\D/g, '').length > 8;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Clientes</h1>
          <p className="page-subtitle">{total} cliente{total !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditando(null); setModalAberto(true); }}>
          <Plus size={16} /> Novo cliente
        </button>
      </div>

      <div className={`clientes-layout ${selecionado ? 'clientes-layout--com-detalhe' : ''}`}>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
            <div className="search-bar" style={{ margin: 0 }}>
              <Search size={15} />
              <input
                type="text"
                placeholder="Buscar por nome ou telefone..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
              {busca && (
                <button className="btn-icon" onClick={() => setBusca('')}>
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          <table className="table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Telefone</th>
                <th>Origem</th>
                <th>Atendimentos</th>
                <th>Desde</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {clientes.length === 0 && (
                <tr><td colSpan={6}><p className="empty-state">Nenhum cliente encontrado.</p></td></tr>
              )}
              {clientes.map((c) => (
                <tr
                  key={c.id}
                  className={`clickable ${selecionado?.id === c.id ? 'selected' : ''}`}
                  onClick={() => abrirCliente(c)}
                >
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="cliente-mini-avatar">{c.nome.charAt(0).toUpperCase()}</div>
                      <span style={{ color: semNome(c) ? 'var(--text-muted)' : 'inherit' }}>
                        {semNome(c) ? '— sem nome —' : c.nome}
                      </span>
                    </div>
                  </td>
                  <td>{c.telefone}</td>
                  <td>
                    {c.criado_via_whatsapp !== false ? (
                      <span className="origem-tag origem-tag--whatsapp">
                        <MessageCircle size={11} /> WhatsApp
                      </span>
                    ) : (
                      <span className="origem-tag origem-tag--manual">Manual</span>
                    )}
                  </td>
                  <td>{c.total_agendamentos}</td>
                  <td>{format(new Date(c.criado_em), 'dd/MM/yyyy')}</td>
                  <td>
                    <button className="btn-icon" onClick={(e) => { e.stopPropagation(); abrirEditar(c); }}>
                      <Pencil size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selecionado && (
          <DetalheCliente
            cliente={selecionado}
            historico={historico}
            onEditar={() => abrirEditar(selecionado)}
            onFechar={() => setSelecionado(null)}
          />
        )}
      </div>

      {modalAberto && (
        <ModalCliente
          cliente={editando}
          onSave={handleSave}
          onClose={() => { setModalAberto(false); setEditando(null); }}
        />
      )}
    </div>
  );
}
