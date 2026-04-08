import { useState, useEffect } from 'react';
import { getServicos, createServico, updateServico, deleteServico } from '../api';
import api from '../api/client';
import { Plus, Pencil, Trash2 } from 'lucide-react';

function Modal({ servico, onSave, onClose }) {
  const [form, setForm] = useState(
    servico || { nome: '', descricao: '', especialidade: '', duracao_minutos: 60, preco: '', ativo: true }
  );
  const [especialidades, setEspecialidades] = useState([]);

  useEffect(() => {
    api.get('/salao/especialidades/').then((r) => setEspecialidades(r.data.results || r.data)
    );
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{servico ? 'Editar Serviço' : 'Novo Serviço'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nome</label>
            <input name="nome" value={form.nome} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Especialidade</label>
            <select name="especialidade" value={form.especialidade} onChange={handleChange} required>
              <option value="">Selecione...</option>
              {especialidades.map((e) => (
                <option key={e.id} value={e.id}>{e.nome}</option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Duração (min)</label>
              <input type="number" name="duracao_minutos" value={form.duracao_minutos} onChange={handleChange} min={15} required />
            </div>
            <div className="form-group">
              <label>Preço (R$)</label>
              <input type="number" name="preco" value={form.preco} onChange={handleChange} step="0.01" min={0} required />
            </div>
          </div>
          <div className="form-group">
            <label>Descrição</label>
            <textarea name="descricao" value={form.descricao} onChange={handleChange} rows={2} />
          </div>
          <div className="form-check">
            <input type="checkbox" name="ativo" id="ativo" checked={form.ativo} onChange={handleChange} />
            <label htmlFor="ativo">Ativo</label>
          </div>
          <div className="modal-actions">
            <button type="submit" className="btn btn-primary">Salvar</button>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Servicos() {
  const [servicos, setServicos] = useState([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState(null);

  const carregar = () => getServicos({ page_size: 100 }).then((r) => setServicos(r.data.results || r.data));
  useEffect(() => { carregar(); }, []);

  const handleSave = async (form) => {
    if (editando) {
      await updateServico(editando.id, form);
    } else {
      await createServico(form);
    }
    setModalAberto(false);
    setEditando(null);
    carregar();
  };

  const handleDelete = async (id) => {
    if (confirm('Excluir este serviço?')) {
      await deleteServico(id);
      carregar();
    }
  };

  const abrirNovo = () => { setEditando(null); setModalAberto(true); };
  const abrirEditar = (s) => { setEditando(s); setModalAberto(true); };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Serviços</h1>
        <button className="btn btn-primary" onClick={abrirNovo}>
          <Plus size={16} /> Novo serviço
        </button>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Especialidade</th>
              <th>Duração</th>
              <th>Preço</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {servicos.map((s) => (
              <tr key={s.id}>
                <td>{s.nome}</td>
                <td>{s.especialidade_nome}</td>
                <td>{s.duracao_minutos} min</td>
                <td>R$ {s.preco}</td>
                <td>
                  <span className={`badge ${s.ativo ? 'badge-confirmado' : 'badge-cancelado'}`}>
                    {s.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="actions">
                  <button className="btn-icon" onClick={() => abrirEditar(s)}>
                    <Pencil size={15} />
                  </button>
                  <button className="btn-icon btn-icon--danger" onClick={() => handleDelete(s.id)}>
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalAberto && (
        <Modal
          servico={editando}
          onSave={handleSave}
          onClose={() => { setModalAberto(false); setEditando(null); }}
        />
      )}
    </div>
  );
}
