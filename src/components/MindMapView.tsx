import React, { useState } from 'react';
import { Plus, GitBranch, Save, Sparkles, Trash2, RotateCcw } from 'lucide-react';
import { Category, MindNode } from '../types/index.ts';
import { t } from '../utils/translations.ts';

interface MindMapViewProps {
  category: Category;
  lang: 'ar' | 'en';
  onUpdateCategory: (updated: Category) => void;
}

export const MindMapView: React.FC<MindMapViewProps> = ({
  category,
  lang,
  onUpdateCategory,
}) => {
  const initialNodes: MindNode[] =
    category.mindNodes && category.mindNodes.length > 0
      ? category.mindNodes
      : [
          {
            id: 'root',
            text: lang === 'ar' ? category.name : category.nameEn || category.name,
            x: 350,
            y: 180,
            color: category.color || '#7c5cfc',
          },
        ];

  const [nodes, setNodes] = useState<MindNode[]>(initialNodes);
  const [selectedNodeId, setSelectedNodeId] = useState<string>('root');
  const [newNodeText, setNewNodeText] = useState('');
  const [savedMessage, setSavedMessage] = useState(false);

  const handleAddChildNode = () => {
    if (!newNodeText.trim()) return;
    const parent = nodes.find((n) => n.id === selectedNodeId) || nodes[0];

    const childCount = nodes.filter((n) => n.parentId === parent.id).length;
    const angle = (childCount * 45 * Math.PI) / 180;
    const distance = 140;

    const newX = Math.round(parent.x + Math.cos(angle) * distance);
    const newY = Math.round(parent.y + Math.sin(angle) * distance);

    const colors = ['#7c5cfc', '#00d4aa', '#ffb347', '#ff4d6a', '#4da6ff', '#a855f7'];
    const chosenColor = colors[nodes.length % colors.length];

    const newNode: MindNode = {
      id: Math.random().toString(36).slice(2, 9),
      text: newNodeText.trim(),
      x: Math.max(40, Math.min(680, newX)),
      y: Math.max(40, Math.min(360, newY)),
      color: chosenColor,
      parentId: parent.id,
    };

    const updated = [...nodes, newNode];
    setNodes(updated);
    setNewNodeText('');
    onUpdateCategory({ ...category, mindNodes: updated });
  };

  const handleDeleteNode = (id: string) => {
    if (id === 'root') return;
    const updated = nodes.filter((n) => n.id !== id && n.parentId !== id);
    setNodes(updated);
    setSelectedNodeId('root');
    onUpdateCategory({ ...category, mindNodes: updated });
  };

  const handleSave = () => {
    onUpdateCategory({ ...category, mindNodes: nodes });
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 2000);
  };

  const handleGenerateMindMapAI = () => {
    const rootName = lang === 'ar' ? category.name : category.nameEn || category.name;
    const generated: MindNode[] = [
      { id: 'root', text: rootName, x: 350, y: 180, color: '#7c5cfc' },
      { id: 'n1', text: '1. Core Concepts', x: 200, y: 100, color: '#00d4aa', parentId: 'root' },
      { id: 'n2', text: '2. Methodologies', x: 500, y: 100, color: '#ffb347', parentId: 'root' },
      { id: 'n3', text: '3. Applications', x: 200, y: 260, color: '#4da6ff', parentId: 'root' },
      { id: 'n4', text: '4. Summary & Review', x: 500, y: 260, color: '#ec4899', parentId: 'root' },
    ];
    setNodes(generated);
    onUpdateCategory({ ...category, mindNodes: generated });
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#12122a] border border-[#2a2a4a] p-4 rounded-2xl">
        <div className="flex items-center gap-2">
          <GitBranch className="w-5 h-5 text-purple-400" />
          <h2 className="text-base font-extrabold text-[#e8e8f0]">
            {t('mindMapTitle', lang)}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleGenerateMindMapAI}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/30 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>{t('generateMindMap', lang)}</span>
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1c1c3a] border border-[#2a2a4a] hover:border-purple-500/40 text-xs font-bold text-[#e8e8f0] transition-colors"
          >
            <Save className="w-4 h-4 text-teal-400" />
            <span>{savedMessage ? 'Saved!' : t('save', lang)}</span>
          </button>
        </div>
      </div>

      {/* Add Branch Controls */}
      <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#12122a] border border-[#2a2a4a]">
        <input
          type="text"
          value={newNodeText}
          onChange={(e) => setNewNodeText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddChildNode()}
          placeholder={lang === 'ar' ? 'اكتب نص الفرع أو الفكرة ثم انقر إضافة...' : 'Type branch concept name...'}
          className="flex-1 px-3 py-2 rounded-xl bg-[#1c1c3a] border border-[#2a2a4a] text-xs text-[#e8e8f0] focus:outline-none focus:border-purple-500"
        />
        <button
          onClick={handleAddChildNode}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-[#052a22] font-extrabold text-xs shadow-md transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Node</span>
        </button>
      </div>

      {/* Canvas Area */}
      <div className="relative w-full h-[450px] rounded-2xl bg-[#12122a] border border-[#2a2a4a] overflow-hidden p-4 select-none">
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {nodes.map((node) => {
            if (!node.parentId) return null;
            const parent = nodes.find((n) => n.id === node.parentId);
            if (!parent) return null;

            return (
              <line
                key={`line-${node.id}`}
                x1={parent.x}
                y1={parent.y}
                x2={node.x}
                y2={node.y}
                stroke={node.color || '#7c5cfc'}
                strokeWidth="2.5"
                strokeDasharray="4 2"
                opacity="0.6"
              />
            );
          })}
        </svg>

        {/* Nodes */}
        {nodes.map((node) => {
          const isSelected = selectedNodeId === node.id;
          const isRoot = node.id === 'root';

          return (
            <div
              key={node.id}
              onClick={() => setSelectedNodeId(node.id)}
              className={`absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2 p-3 rounded-2xl transition-all duration-200 shadow-xl ${
                isSelected ? 'ring-2 ring-white scale-105' : 'hover:scale-102'
              }`}
              style={{
                left: `${node.x}px`,
                top: `${node.y}px`,
                backgroundColor: isRoot ? '#1c1c3a' : '#161632',
                border: `2px solid ${node.color || '#7c5cfc'}`,
                boxShadow: `0 4px 20px ${node.color || '#7c5cfc'}33`,
              }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: node.color || '#7c5cfc' }}
                />
                <span className="font-extrabold text-xs text-[#e8e8f0] whitespace-nowrap">
                  {node.text}
                </span>

                {!isRoot && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteNode(node.id);
                    }}
                    className="p-0.5 rounded text-[#8888a8] hover:text-rose-400 ms-1"
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
