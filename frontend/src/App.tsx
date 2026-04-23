import { useState, useCallback, useEffect } from 'react';
import { useNodesState, useEdgesState, addEdge } from '@xyflow/react';
import Sidebar from './components/Sidebar';
import Canvas from './components/Canvas';
import SqlModal from './components/SqlModal';
import TabsBar from './components/TabsBar';
import { parseSQLToDiagram } from './sqlParser';
import { getLayoutedElements } from './layout';
import { toPng } from 'html-to-image';
import { Toaster, toast } from 'react-hot-toast';

const initialNodes = [
  {
    id: '1',
    type: 'tableNode',
    position: { x: 250, y: 100 },
    data: { 
      label: 'Users',
      columns: [
        { id: 'col_1', name: 'id', type: 'integer' },
        { id: 'col_2', name: 'email', type: 'varchar' }
      ]
    },
  },
];

const initialEdges: any[] = [];

export default function App() {
  const [tabs, setTabs] = useState<any[]>(() => {
    const saved = localStorage.getItem('dbplanner_tabs');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [{ id: 'tab-1', name: 'Diagrama 1', nodes: initialNodes, edges: initialEdges }];
  });

  const [activeTabId, setActiveTabId] = useState(() => {
    const saved = localStorage.getItem('dbplanner_active_tab');
    if (saved) return saved;
    return 'tab-1';
  });

  const [nodes, setNodes, onNodesChange] = useNodesState<any>((() => {
     const savedTabs = localStorage.getItem('dbplanner_tabs');
     const savedActiveTab = localStorage.getItem('dbplanner_active_tab') || 'tab-1';
     if (savedTabs) {
        try {
           const parsedTabs = JSON.parse(savedTabs);
           const active = parsedTabs.find((t: any) => t.id === savedActiveTab) || parsedTabs[0];
           return active ? active.nodes : initialNodes;
        } catch (e) {}
     }
     return initialNodes;
  })());

  const [edges, setEdges, onEdgesChange] = useEdgesState<any>((() => {
     const savedTabs = localStorage.getItem('dbplanner_tabs');
     const savedActiveTab = localStorage.getItem('dbplanner_active_tab') || 'tab-1';
     if (savedTabs) {
        try {
           const parsedTabs = JSON.parse(savedTabs);
           const active = parsedTabs.find((t: any) => t.id === savedActiveTab) || parsedTabs[0];
           return active ? active.edges : initialEdges;
        } catch (e) {}
     }
     return initialEdges;
  })());
  const [sqlModalOpen, setSqlModalOpen] = useState(false);
  const [generatedSql, setGeneratedSql] = useState("");

  // Injetando a função de update dentro dos dados do nó para ele poder se atualizar
  const onUpdateNodeData = useCallback((id: string, newData: any) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          node.data = newData;
        }
        return node;
      })
    );
  }, [setNodes]);

  // Garantir que todos os nós tenham a função onUpdate atualizada e a lista de nós
  const nodesWithUpdaters = nodes.map(node => ({
    ...node,
    data: {
      ...node.data,
      onUpdate: onUpdateNodeData,
      allNodes: nodes,
      onAddEdge: (source: string, sourceHandle: string, target: string, targetHandle: string) => {
        setEdges((eds: any) => addEdge({ 
            source, 
            sourceHandle, 
            target, 
            targetHandle,
            animated: true,
            style: { stroke: '#3b82f6', strokeWidth: 2, strokeDasharray: '5, 5' },
            markerEnd: 'url(#crows-foot)',
            className: 'pulsing-edge'
        } as any, eds));
      },
      onDeleteNode: (nodeId: string) => {
        setNodes((nds: any) => nds.filter((n: any) => n.id !== nodeId));
        setEdges((eds: any) => eds.filter((e: any) => e.source !== nodeId && e.target !== nodeId));
      }
    }
  }));

  const onAddTable = () => {
    const newNodeId = `${Date.now()}`;
    const newNode = {
      id: newNodeId,
      type: 'tableNode',
      position: { x: Math.random() * 200 + 100, y: Math.random() * 200 + 100 },
      data: {
        label: `NewTable_${nodes.length + 1}`,
        columns: [{ id: `col_${Date.now()}`, name: 'id', type: 'integer' }]
      }
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const switchTab = (tabId: string) => {
    if (tabId === activeTabId) return;

    // Salva o estado atual na aba atual antes de trocar
    setTabs(prev => prev.map(t => 
      t.id === activeTabId ? { ...t, nodes, edges } : t
    ));

    const targetTab = tabs.find(t => t.id === tabId);
    if (targetTab) {
       setNodes(targetTab.nodes);
       setEdges(targetTab.edges);
       setActiveTabId(tabId);
    }
  };

  const addTab = () => {
    const newTabId = `tab-${Date.now()}`;
    const newTab = {
      id: newTabId,
      name: `Diagrama ${tabs.length + 1}`,
      nodes: [],
      edges: []
    };
    
    // Salva a aba atual e adiciona a nova
    setTabs(prev => {
       const updated = prev.map(t => t.id === activeTabId ? { ...t, nodes, edges } : t);
       return [...updated, newTab];
    });
    
    setNodes([]);
    setEdges([]);
    setActiveTabId(newTabId);
  };

  // Efeito para roteamento inteligente das linhas
  useEffect(() => {
    if (!nodes.length || !edges.length) return;

    setEdges((eds: any[]) => {
      let changed = false;
      const newEdges = eds.map((edge) => {
        const sourceNode = nodes.find((n: any) => n.id === edge.source);
        const targetNode = nodes.find((n: any) => n.id === edge.target);
        if (!sourceNode || !targetNode) return edge;

        // Se o nó de origem estiver mais à esquerda, a linha sai da direita dele e entra na esquerda do alvo
        const isSourceLeft = sourceNode.position.x + 140 < targetNode.position.x;
        
        // Remove os sufixos atuais para pegar o ID puro da coluna
        const sourceColId = edge.sourceHandle?.replace(/-right-source|-left-source|-source|-right|-left/g, '');
        const targetColId = edge.targetHandle?.replace(/-left-target|-right-target|-target|-left|-right/g, '');

        if (!sourceColId || !targetColId) return edge;

        const newSourceHandle = isSourceLeft ? `${sourceColId}-right-source` : `${sourceColId}-left-source`;
        const newTargetHandle = isSourceLeft ? `${targetColId}-left-target` : `${targetColId}-right-target`;

        if (edge.sourceHandle !== newSourceHandle || edge.targetHandle !== newTargetHandle) {
          changed = true;
          return { ...edge, sourceHandle: newSourceHandle, targetHandle: newTargetHandle };
        }
        return edge;
      });
      return changed ? newEdges : eds;
    });
  }, [nodes, setEdges]);

  // Efeito para auto-save no LocalStorage (Debounced)
  useEffect(() => {
    const timeout = setTimeout(() => {
      const tabsToSave = tabs.map(t => t.id === activeTabId ? { ...t, nodes, edges } : t);
      localStorage.setItem('dbplanner_tabs', JSON.stringify(tabsToSave));
      localStorage.setItem('dbplanner_active_tab', activeTabId);
    }, 500);
    return () => clearTimeout(timeout);
  }, [tabs, activeTabId, nodes, edges]);

  const closeTab = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    if (tabs.length === 1) {
      toast.error("Você não pode fechar o único diagrama aberto.");
      return;
    }

    const newTabs = tabs.filter(t => t.id !== tabId);
    if (tabId === activeTabId) {
      const nextTab = newTabs[0];
      setNodes(nextTab.nodes);
      setEdges(nextTab.edges);
      setActiveTabId(nextTab.id);
    }
    setTabs(newTabs);
  };

  const onExportSQL = () => {
    let sql = "-- Script gerado pelo DB Planner\n\n";
    
    nodes.forEach((node: any) => {
        const tableName = node.data.label;
        sql += `CREATE TABLE "${tableName}" (\n`;
        
        const cols = node.data.columns;
        const colDefinitions: string[] = [];
        const fkDefinitions: string[] = [];
        
        cols.forEach((col: any) => {
            if (col.type === 'fk') {
               // Define como INTEGER por padrão para chaves estrangeiras
               colDefinitions.push(`  "${col.name}" INTEGER`); 
               
               const targetTable = nodes.find((n: any) => n.id === col.fkTargetTable);
               if (targetTable) {
                   const targetCol = targetTable.data.columns.find((c: any) => c.id === col.fkTargetCol);
                   if (targetCol) {
                       fkDefinitions.push(`  FOREIGN KEY ("${col.name}") REFERENCES "${targetTable.data.label}" ("${targetCol.name}")`);
                   }
               }
            } else {
               const typeMap: any = {
                 integer: 'INTEGER',
                 varchar: 'VARCHAR(255)',
                 text: 'TEXT',
                 boolean: 'BOOLEAN',
                 date: 'DATE',
                 timestamp: 'TIMESTAMP',
                 numeric: 'NUMERIC',
                 float: 'FLOAT',
                 uuid: 'UUID'
               };
               const sqlType = typeMap[col.type] || col.type.toUpperCase();
               colDefinitions.push(`  "${col.name}" ${sqlType}`);
            }
        });
        
        const allDefs = [...colDefinitions, ...fkDefinitions];
        sql += allDefs.join(",\n");
        sql += "\n);\n\n";
    });

    setGeneratedSql(sql);
    setSqlModalOpen(true);
  };

  const onApplySQL = (sqlText: string) => {
    try {
      const { newNodes, newEdges } = parseSQLToDiagram(sqlText);
      setNodes(newNodes);
      setEdges(newEdges);
      toast.success("Diagrama atualizado com sucesso a partir do SQL!");
    } catch (e) {
      toast.error("Erro ao interpretar o SQL. Verifique a sintaxe.");
      console.error(e);
    }
  };

  const onAutoLayout = useCallback(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nodes, edges, 'LR');
    setNodes([...layoutedNodes]);
    setEdges([...layoutedEdges]);
    toast.success("Diagrama organizado magicamente!");
  }, [nodes, edges, setNodes, setEdges]);

  const onDownloadImage = useCallback(() => {
    const el = document.querySelector('.react-flow') as HTMLElement;
    if (el) {
      toast.loading("Gerando imagem...", { id: 'download' });
      toPng(el, { backgroundColor: '#0f172a' })
        .then((dataUrl) => {
          const link = document.createElement('a');
          link.download = `diagrama-${Date.now()}.png`;
          link.href = dataUrl;
          link.click();
          toast.success("Imagem baixada!", { id: 'download' });
        })
        .catch(() => {
          toast.error("Erro ao gerar imagem.", { id: 'download' });
        });
    }
  }, []);

  return (
    <div className="app-container">
      <Toaster 
        position="bottom-right" 
        toastOptions={{ 
          style: { 
            background: 'var(--bg-secondary)', 
            color: 'var(--text-main)', 
            border: '1px solid var(--border-color)',
            fontSize: '0.9rem'
          } 
        }} 
      />
      <Sidebar 
        onAddTable={onAddTable} 
        onExportSQL={onExportSQL} 
        onAutoLayout={onAutoLayout}
        onDownloadImage={onDownloadImage}
      />
      
      <div className="workspace-area">
        <TabsBar 
          tabs={tabs} 
          activeTabId={activeTabId} 
          onSwitchTab={switchTab} 
          onAddTab={addTab} 
          onCloseTab={closeTab} 
        />
        <Canvas 
          nodes={nodesWithUpdaters} 
          edges={edges} 
          setEdges={setEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
        />
      </div>

      <SqlModal isOpen={sqlModalOpen} onClose={() => setSqlModalOpen(false)} sql={generatedSql} onApply={onApplySQL} />
    </div>
  );
}
