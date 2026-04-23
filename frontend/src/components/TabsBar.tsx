import { Plus, X } from 'lucide-react';

interface Tab {
  id: string;
  name: string;
}

interface TabsBarProps {
  tabs: Tab[];
  activeTabId: string;
  onSwitchTab: (id: string) => void;
  onAddTab: () => void;
  onCloseTab: (e: React.MouseEvent, id: string) => void;
}

export default function TabsBar({ tabs, activeTabId, onSwitchTab, onAddTab, onCloseTab }: TabsBarProps) {
  return (
    <div className="tabs-bar">
      {tabs.map(tab => (
        <div 
          key={tab.id} 
          className={`tab-item ${tab.id === activeTabId ? 'active' : ''}`}
          onClick={() => onSwitchTab(tab.id)}
        >
          {tab.name}
          {tabs.length > 1 && (
            <button className="tab-close" onClick={(e) => onCloseTab(e, tab.id)} title="Fechar Aba">
              <X size={12} />
            </button>
          )}
        </div>
      ))}
      <button className="tab-add" onClick={onAddTab} title="Novo Diagrama">
        <Plus size={16} />
      </button>
    </div>
  );
}
