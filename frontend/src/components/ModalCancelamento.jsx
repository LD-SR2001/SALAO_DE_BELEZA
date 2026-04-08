import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function ModalCancelamento({ agendamento, onConfirmar, onClose }) {
  const [motivo, setMotivo] = useState('');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  const handleConfirmar = async () => {
    if (!motivo.trim()) {
      setErro('O motivo do cancelamento é obrigatório.');
      return;
    }
    setSalvando(true);
    try {
      await onConfirmar(motivo.trim());
    } catch {
      setErro('Erro ao cancelar. Tente novamente.');
      setSalvando(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--cancelamento" onClick={(e) => e.stopPropagation()}>
        <div className="cancelamento-icone">
          <AlertTriangle size={28} />
        </div>

        <h3>Cancelar atendimento</h3>

        {agendamento && (
          <div className="cancelamento-resumo">
            <strong>{agendamento.cliente_detalhes?.nome}</strong>
            <span>
              {agendamento.servicos_detalhes?.map((s) => s.nome).join(', ')}
              {' · '}
              {agendamento.profissional_detalhes?.nome}
            </span>
          </div>
        )}

        <div className="form-group" style={{ marginBottom: 4 }}>
          <label>Motivo do cancelamento <span className="campo-obrigatorio">*</span></label>
          <textarea
            value={motivo}
            onChange={(e) => { setMotivo(e.target.value); setErro(''); }}
            rows={3}
            placeholder="Ex: Cliente solicitou cancelamento, problema de saúde, conflito de agenda..."
            autoFocus
          />
          {erro && <span className="campo-erro">{erro}</span>}
        </div>

        <div className="modal-actions">
          <button
            className="btn btn-danger"
            onClick={handleConfirmar}
            disabled={salvando || !motivo.trim()}
          >
            {salvando ? 'Cancelando...' : 'Confirmar cancelamento'}
          </button>
          <button className="btn btn-secondary" onClick={onClose} disabled={salvando}>
            Voltar
          </button>
        </div>
      </div>
    </div>
  );
}
