import { useState, useEffect, useRef } from 'react';
import api from '../api/client';
import { Plus, Pencil, Trash2, UserCircle, Check, X } from 'lucide-react';

const DIAS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

// ─── Modal de criação/edição ───────────────────────────────────────────────
function ModalProfissional({ profissional, especialidades, onSave, onClose }) {
  const [form, setForm] = useState({
    nome: profissional?.nome || '',
    telefone: profissional?.telefone || '',
    descricao: profissional?.descricao || '',
    especialidades_ids: profissional?.especialidades?.map((e) => e.id) || [],
    ativo: profissional?.ativo ?? true,
  });
  const [fotoPreview, setFotoPreview] = useState(profissional?.foto_url || null);
  const [fotoFile, setFotoFile] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const fileRef = useRef();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const toggleEspecialidade = (id) => {
    setForm((prev) => ({
      ...prev,
      especialidades_ids: prev.especialidades_ids.includes(id)
        ? prev.especialidades_ids.filter((e) => e !== id)
        : [...prev.especialidades_ids, id],
    }));
  };

  const handleFoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFotoFile(file);
    setFotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSalvando(true);
    try {
      const formData = new FormData();
      formData.append('nome', form.nome);
      formData.append('telefone', form.telefone);
      formData.append('descricao', form.descricao);
      formData.append('ativo', form.ativo);
      form.especialidades_ids.forEach((id) => formData.append('especialidades_ids', id));
      if (fotoFile) formData.append('foto', fotoFile);

      if (profissional) {
        await api.patch(`/salao/profissionais/${profissional.id}/`, formData);
      } else {
        await api.post('/salao/profissionais/', formData);
      }
      onSave();
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--lg" onClick={(e) => e.stopPropagation()}>
        <h3>{profissional ? 'Editar Profissional' : 'Nova Profissional'}</h3>
        <form onSubmit={handleSubmit}>
          {/* Foto */}
          <div className="foto-upload" onClick={() => fileRef.current.click()}>
            {fotoPreview ? (
              <img src={fotoPreview} alt="Foto" className="foto-preview" />
            ) : (
              <div className="foto-placeholder">
                <UserCircle size={56} />
                <span>Clique para adicionar foto</span>
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFoto}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Nome</label>
              <input name="nome" value={form.nome} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Telefone</label>
              <input name="telefone" value={form.telefone} onChange={handleChange} placeholder="(11) 99999-9999" />
            </div>
          </div>

          <div className="form-group">
            <label>Descrição / Apresentação</label>
            <textarea
              name="descricao"
              value={form.descricao}
              onChange={handleChange}
              rows={3}
              placeholder="Experiência, especialidades, diferenciais..."
            />
          </div>

          <div className="form-group">
            <label>Especialidades</label>
            <div className="especialidades-chips">
              {especialidades.map((esp) => {
                const ativa = form.especialidades_ids.includes(esp.id);
                return (
                  <button
                    key={esp.id}
                    type="button"
                    className={`chip ${ativa ? 'chip--ativo' : ''}`}
                    onClick={() => toggleEspecialidade(esp.id)}
                  >
                    {ativa && <Check size={12} />}
                    {esp.nome}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="form-check">
            <input type="checkbox" id="ativo" name="ativo" checked={form.ativo} onChange={handleChange} />
            <label htmlFor="ativo">Profissional ativa</label>
          </div>

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

// ─── Card da profissional ──────────────────────────────────────────────────
function CardProfissional({ profissional, onEditar, onExcluir }) {
  return (
    <div className={`prof-card ${!profissional.ativo ? 'prof-card--inativa' : ''}`}>
      <div className="prof-card__foto">
        {profissional.foto_url ? (
          <img src={profissional.foto_url} alt={profissional.nome} />
        ) : (
          <UserCircle size={64} />
        )}
        <span className={`prof-status ${profissional.ativo ? 'prof-status--ativo' : 'prof-status--inativo'}`}>
          {profissional.ativo ? 'Ativa' : 'Inativa'}
        </span>
      </div>

      <div className="prof-card__info">
        <h3>{profissional.nome}</h3>

        <div className="prof-especialidades">
          {profissional.especialidades.map((e) => (
            <span key={e.id} className={`chip chip--${e.tipo}`}>{e.nome}</span>
          ))}
        </div>

        {profissional.descricao && (
          <p className="prof-descricao">{profissional.descricao}</p>
        )}

        {profissional.telefone && (
          <p className="prof-telefone">{profissional.telefone}</p>
        )}
      </div>

      <div className="prof-card__actions">
        <button className="btn-icon" title="Editar" onClick={() => onEditar(profissional)}>
          <Pencil size={15} />
        </button>
        <button className="btn-icon btn-icon--danger" title="Excluir" onClick={() => onExcluir(profissional)}>
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}

// ─── Página principal ──────────────────────────────────────────────────────
export default function Profissionais() {
  const [profissionais, setProfissionais] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [filtro, setFiltro] = useState('todas'); // todas | ativas | inativas

  const carregar = async () => {
    const [rProf, rEsp] = await Promise.all([
      api.get('/salao/profissionais/'),
      api.get('/salao/especialidades/'),
    ]);
    setProfissionais(rProf.data.results || rProf.data);
    setEspecialidades(rEsp.data.results || rEsp.data);
  };

  useEffect(() => { carregar(); }, []);

  const handleSave = () => {
    setModalAberto(false);
    setEditando(null);
    carregar();
  };

  const handleEditar = (p) => { setEditando(p); setModalAberto(true); };

  const handleExcluir = async (p) => {
    if (!confirm(`Excluir ${p.nome}? Esta ação não pode ser desfeita.`)) return;
    await api.delete(`/salao/profissionais/${p.id}/`);
    carregar();
  };

  const lista = profissionais.filter((p) => {
    if (filtro === 'ativas') return p.ativo;
    if (filtro === 'inativas') return !p.ativo;
    return true;
  });

  // Agrupa por especialidade para exibição
  const grupos = especialidades.map((esp) => ({
    especialidade: esp,
    profissionais: lista.filter((p) => p.especialidades.some((e) => e.id === esp.id)),
  })).filter((g) => g.profissionais.length > 0);

  // Profissionais sem especialidade
  const semEsp = lista.filter((p) => p.especialidades.length === 0);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Profissionais</h1>
        <button className="btn btn-primary" onClick={() => { setEditando(null); setModalAberto(true); }}>
          <Plus size={16} /> Nova profissional
        </button>
      </div>

      {/* Filtro */}
      <div className="filtro-tabs">
        {['todas', 'ativas', 'inativas'].map((f) => (
          <button
            key={f}
            className={`filtro-tab ${filtro === f ? 'filtro-tab--ativo' : ''}`}
            onClick={() => setFiltro(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Cards agrupados por especialidade */}
      {grupos.map(({ especialidade, profissionais: profs }) => (
        <div key={especialidade.id} className="grupo-especialidade">
          <h2 className="grupo-titulo">
            <span className={`grupo-badge grupo-badge--${especialidade.tipo}`} />
            {especialidade.nome}
            <span className="grupo-count">{profs.length}</span>
          </h2>
          <div className="prof-grid">
            {profs.map((p) => (
              <CardProfissional
                key={p.id}
                profissional={p}
                onEditar={handleEditar}
                onExcluir={handleExcluir}
              />
            ))}
          </div>
        </div>
      ))}

      {semEsp.length > 0 && (
        <div className="grupo-especialidade">
          <h2 className="grupo-titulo">Sem especialidade</h2>
          <div className="prof-grid">
            {semEsp.map((p) => (
              <CardProfissional key={p.id} profissional={p} onEditar={handleEditar} onExcluir={handleExcluir} />
            ))}
          </div>
        </div>
      )}

      {lista.length === 0 && (
        <div className="card">
          <p className="empty-state">Nenhuma profissional cadastrada ainda.</p>
        </div>
      )}

      {modalAberto && (
        <ModalProfissional
          profissional={editando}
          especialidades={especialidades}
          onSave={handleSave}
          onClose={() => { setModalAberto(false); setEditando(null); }}
        />
      )}
    </div>
  );
}
