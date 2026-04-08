import { useState, useEffect, useRef } from 'react';
import { getConversas, getConversa } from '../api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MessageCircle } from 'lucide-react';

export default function Conversas() {
  const [conversas, setConversas] = useState([]);
  const [selecionada, setSelecionada] = useState(null);
  const [detalhe, setDetalhe] = useState(null);
  const bottomRef = useRef(null);
  const wsRef = useRef(null);

  useEffect(() => {
    getConversas({ ordering: '-atualizada_em' }).then((r) => {
      setConversas(r.data.results || r.data);
    });

    // WebSocket para atualizações em tempo real
    const ws = new WebSocket('ws://localhost:8000/ws/conversas/');
    wsRef.current = ws;
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.tipo === 'nova_mensagem') {
        getConversas({ ordering: '-atualizada_em' }).then((r) => {
          setConversas(r.data.results || r.data);
        });
        if (selecionada?.id === msg.conversa_id) {
          getConversa(msg.conversa_id).then((r) => setDetalhe(r.data));
        }
      }
    };
    return () => ws.close();
  }, []);

  const abrirConversa = async (conversa) => {
    setSelecionada(conversa);
    const { data } = await getConversa(conversa.id);
    setDetalhe(data);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [detalhe]);

  return (
    <div className="page conversas-page">
      <div className="page-header">
        <h1>Conversas WhatsApp</h1>
      </div>

      <div className="conversas-layout">
        {/* Lista de conversas */}
        <div className="conversas-lista card">
          {conversas.length === 0 && (
            <p className="empty-state">Nenhuma conversa ainda.</p>
          )}
          {conversas.map((c) => (
            <button
              key={c.id}
              className={`conversa-item ${selecionada?.id === c.id ? 'active' : ''}`}
              onClick={() => abrirConversa(c)}
            >
              <div className="conversa-avatar">
                <MessageCircle size={20} />
              </div>
              <div className="conversa-info">
                <strong>{c.cliente_nome || c.telefone}</strong>
                <span className="conversa-hora">
                  {format(new Date(c.atualizada_em), "dd/MM HH:mm", { locale: ptBR })}
                </span>
              </div>
              <span className={`badge badge-${c.status}`}>{c.status}</span>
            </button>
          ))}
        </div>

        {/* Detalhe da conversa */}
        <div className="conversa-detalhe card">
          {!detalhe ? (
            <div className="conversa-vazia">
              <MessageCircle size={48} />
              <p>Selecione uma conversa</p>
            </div>
          ) : (
            <>
              <div className="conversa-header">
                <strong>{detalhe.cliente_nome || detalhe.telefone}</strong>
                <span>{detalhe.telefone}</span>
              </div>
              <div className="mensagens-lista">
                {detalhe.mensagens.map((msg) => (
                  <div key={msg.id} className={`mensagem mensagem--${msg.direcao}`}>
                    <div className="mensagem-conteudo">{msg.conteudo}</div>
                    <div className="mensagem-hora">
                      {format(new Date(msg.enviada_em), 'HH:mm')}
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
