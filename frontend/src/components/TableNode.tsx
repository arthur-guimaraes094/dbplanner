import React, { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Plus, X, GripVertical, Link, Trash2 } from 'lucide-react';

export default function TableNode({ data, id }: any) {
  const [columns, setColumns] = useState(data.columns || [{ id: `col_${Date.now()}`, name: 'id', type: 'integer' }]);
  const [draggedColId, setDraggedColId] = useState<string | null>(null);

  const addColumn = () => {
    const newCol = { id: `col_${Date.now()}`, name: 'new_column', type: 'varchar' };
    const newColumns = [...columns, newCol];
    setColumns(newColumns);
    data.onUpdate(id, { ...data, columns: newColumns });
  };

  const removeColumn = (colId: string) => {
    const newColumns = columns.filter((c: any) => c.id !== colId);
    setColumns(newColumns);
    data.onUpdate(id, { ...data, columns: newColumns });
  };

  const updateColumn = (colId: string, field: string, value: string) => {
    const newColumns = columns.map((c: any) => 
      c.id === colId ? { ...c, [field]: value } : c
    );
    setColumns(newColumns);
    data.onUpdate(id, { ...data, columns: newColumns });
  };

  const onTableNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    data.onUpdate(id, { ...data, label: e.target.value, columns });
  };

  // --- Drag and Drop Logic ---
  const handleDragStart = (e: React.DragEvent, colId: string) => {
    setDraggedColId(colId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); 
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e: React.DragEvent, targetColId: string) => {
    e.preventDefault();
    if (!draggedColId || draggedColId === targetColId) return;

    const draggedIndex = columns.findIndex((c: any) => c.id === draggedColId);
    const targetIndex = columns.findIndex((c: any) => c.id === targetColId);

    const newColumns = [...columns];
    const [draggedItem] = newColumns.splice(draggedIndex, 1);
    newColumns.splice(targetIndex, 0, draggedItem);

    setColumns(newColumns);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    // Salva o estado final no pai apenas ao soltar
    data.onUpdate(id, { ...data, columns });
    setDraggedColId(null);
  };

  const handleDragEnd = () => {
    setDraggedColId(null);
  };

  // --- FK Logic ---
  const otherTables = (data.allNodes || []).filter((n: any) => n.id !== id);

  return (
    <div className="table-node">
      <div className="table-node-header">
        <input 
          type="text" 
          value={data.label} 
          onChange={onTableNameChange}
          className="nodrag"
          size={Math.max(3, (data.label || '').length)}
        />
        <button 
          onClick={() => data.onDeleteNode && data.onDeleteNode(id)}
          className="nodrag"
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.2s' }}
          title="Excluir Tabela"
          onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="table-columns">
        {columns.map((col: any) => (
          <div 
            key={col.id} 
            className="table-column nodrag"
            draggable
            onDragStart={(e) => handleDragStart(e, col.id)}
            onDragOver={handleDragOver}
            onDragEnter={(e) => handleDragEnter(e, col.id)}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
            style={{ 
              opacity: draggedColId === col.id ? 0.4 : 1,
              backgroundColor: draggedColId === col.id ? 'rgba(255,255,255,0.05)' : 'transparent',
              paddingLeft: '24px' // Espaço para a Handle
            }}
          >
            {/* Handle da Esquerda (Target/Source) */}
            <Handle 
              type="target" 
              position={Position.Left} 
              id={`${col.id}-left-target`} 
              className="table-handle"
            />
            <Handle 
              type="source" 
              position={Position.Left} 
              id={`${col.id}-left-source`} 
              className="table-handle"
              style={{ opacity: 0 }}
            />
            
            <GripVertical size={14} className="drag-handle" style={{ cursor: 'grab', color: 'var(--text-muted)', position: 'absolute', left: 6 }} />
            
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '4px' }}>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <input 
                  type="text" 
                  className="col-name nodrag" 
                  value={col.name} 
                  onChange={(e) => updateColumn(col.id, 'name', e.target.value)}
                />
                <select 
                  className="col-type nodrag" 
                  value={col.type} 
                  onChange={(e) => updateColumn(col.id, 'type', e.target.value)}
                >
                  <option value="integer">int</option>
                  <option value="varchar">varchar</option>
                  <option value="text">text</option>
                  <option value="boolean">bool</option>
                  <option value="date">date</option>
                  <option value="timestamp">timestamp</option>
                  <option value="numeric">numeric</option>
                  <option value="float">float</option>
                  <option value="uuid">uuid</option>
                  <option value="fk" style={{ fontWeight: 'bold', color: '#3b82f6' }}>FK (Chave Estrangeira)</option>
                </select>
                <button 
                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                  onClick={() => removeColumn(col.id)}
                >
                  <X size={14} />
                </button>
              </div>

              {/* Renderiza as opções de FK se o tipo for 'fk' */}
              {col.type === 'fk' && (
                <div className="nodrag" style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '4px', alignItems: 'center' }}>
                  <Link size={12} color="#3b82f6" />
                  <select 
                    className="fk-select nodrag"
                    value={col.fkTargetTable || ''}
                    onChange={(e) => updateColumn(col.id, 'fkTargetTable', e.target.value)}
                  >
                    <option value="">Tabela...</option>
                    {otherTables.map((t: any) => (
                      <option key={t.id} value={t.id}>{t.data.label}</option>
                    ))}
                  </select>

                  <select 
                    className="fk-select nodrag"
                    value={col.fkTargetCol || ''}
                    onChange={(e) => {
                      const targetColId = e.target.value;
                      updateColumn(col.id, 'fkTargetCol', targetColId);
                      
                      // Auto Link!
                      if (col.fkTargetTable && targetColId && data.onAddEdge) {
                        data.onAddEdge(id, `${col.id}-right-source`, col.fkTargetTable, `${targetColId}-left-target`);
                      }
                    }}
                  >
                    <option value="">Coluna...</option>
                    {(() => {
                      const targetTable = otherTables.find((t: any) => t.id === col.fkTargetTable);
                      if (!targetTable) return null;
                      return targetTable.data.columns.map((c: any) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ));
                    })()}
                  </select>
                </div>
              )}
            </div>

            {/* Handle da Direita (Target/Source) */}
            <Handle 
              type="source" 
              position={Position.Right} 
              id={`${col.id}-right-source`} 
              className="table-handle"
            />
            <Handle 
              type="target" 
              position={Position.Right} 
              id={`${col.id}-right-target`} 
              className="table-handle"
              style={{ opacity: 0 }}
            />
          </div>
        ))}
        
        <button className="add-column-btn nodrag" onClick={addColumn}>
          <Plus size={14} /> Add Column
        </button>
      </div>
    </div>
  );
}
