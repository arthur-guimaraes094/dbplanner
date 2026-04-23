import { Plus, Code, Wand2, Download } from 'lucide-react';

interface SidebarProps {
  onAddTable: () => void;
  onExportSQL: () => void;
  onAutoLayout: () => void;
  onDownloadImage: () => void;
}

export default function Sidebar({ onAddTable, onExportSQL, onAutoLayout, onDownloadImage }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1>DB Planner</h1>
      </div>
      <div className="sidebar-content">
        <button className="btn" onClick={onAddTable}>
          <Plus size={18} /> Nova Tabela
        </button>
        
        <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
            Ações do Projeto
          </p>
          <button className="btn btn-secondary" onClick={onAutoLayout} style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
            <Wand2 size={18} /> Auto Layout
          </button>
          <button className="btn btn-secondary" onClick={onDownloadImage} style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
            <Download size={18} /> Baixar Imagem
          </button>
          <button className="btn btn-secondary" onClick={onExportSQL} style={{ marginBottom: '10px', borderColor: '#10b981', color: '#10b981', display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
             <Code size={18} /> SQL Editor
          </button>
        </div>
      </div>
    </aside>
  );
}
