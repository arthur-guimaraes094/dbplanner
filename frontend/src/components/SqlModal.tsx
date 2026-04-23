import { X, Copy, Check, Play } from 'lucide-react';
import { useState, useEffect } from 'react';

interface SqlModalProps {
  isOpen: boolean;
  onClose: () => void;
  sql: string;
  onApply: (sql: string) => void;
}

export default function SqlModal({ isOpen, onClose, sql, onApply }: SqlModalProps) {
  const [copied, setCopied] = useState(false);
  const [editableSql, setEditableSql] = useState(sql);

  useEffect(() => {
    setEditableSql(sql);
  }, [sql, isOpen]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(editableSql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApply = () => {
    onApply(editableSql);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ width: '800px', height: '80vh' }}>
        <div className="modal-header">
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Editor SQL</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
            Você pode copiar o SQL gerado ou digitar seus próprios comandos <code>CREATE TABLE</code> e clicar em Aplicar para gerar as caixinhas visualmente.
          </p>
          <textarea 
            value={editableSql}
            onChange={(e) => setEditableSql(e.target.value)}
            style={{ 
              flex: 1, 
              background: 'var(--bg-color)', 
              color: '#38bdf8', 
              fontFamily: 'monospace', 
              padding: '16px', 
              borderRadius: '6px', 
              border: '1px solid var(--border-color)',
              resize: 'none',
              outline: 'none',
              whiteSpace: 'pre'
            }}
          />
        </div>
        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <button className="btn" onClick={handleCopy} style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'transparent', border: '1px solid var(--border-color)' }}>
            {copied ? <Check size={18} /> : <Copy size={18} />}
            {copied ? 'Copiado!' : 'Copiar SQL'}
          </button>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button className="btn" onClick={handleApply} style={{ display: 'flex', gap: '8px', alignItems: 'center', background: '#3b82f6', color: '#fff' }}>
              <Play size={18} /> Aplicar ao Diagrama
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
