import React, { useState } from 'react';
import { Plus, FileText, Trash2 } from 'lucide-react';
import { Category, Note } from '../types/index.ts';
import { t } from '../utils/translations.ts';

interface NotesViewProps {
  category: Category;
  lang: 'ar' | 'en';
  onUpdateCategory: (updated: Category) => void;
}

export const NotesView: React.FC<NotesViewProps> = ({
  category,
  lang,
  onUpdateCategory,
}) => {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const notes = category.notes || [];

  const handleAddNote = () => {
    if (!title.trim() || !content.trim()) return;
    const newNote: Note = {
      id: Math.random().toString(36).slice(2, 9),
      title: title.trim(),
      content: content.trim(),
      updatedAt: Date.now(),
    };
    onUpdateCategory({ ...category, notes: [newNote, ...notes] });
    setTitle('');
    setContent('');
    setIsAddOpen(false);
  };

  const handleDeleteNote = (id: string) => {
    onUpdateCategory({ ...category, notes: notes.filter((n) => n.id !== id) });
  };

  return (
    <div className="space-y-6">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#12122a] border border-[#2a2a4a] p-4 rounded-2xl">
        <h2 className="text-base font-extrabold text-[#e8e8f0]">
          {t('tabNotes', lang)} ({notes.length})
        </h2>

        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>{t('addNote', lang)}</span>
        </button>
      </div>

      {/* Notes Grid */}
      {notes.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#12122a] border border-dashed border-[#2a2a4a] text-[#8888a8] space-y-3">
          <FileText className="w-10 h-10 mx-auto text-[#5a5a78]" />
          <h4 className="font-extrabold text-sm text-[#e8e8f0]">
            {t('noNotes', lang)}
          </h4>
          <p className="text-xs max-w-sm mx-auto">{t('noNotesSub', lang)}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.map((note) => (
            <div
              key={note.id}
              className="group p-5 rounded-2xl bg-[#12122a] border border-[#2a2a4a] hover:border-purple-500/40 transition-all flex flex-col justify-between"
              style={{
                borderInlineStartWidth: '4px',
                borderInlineStartColor: category.color || '#7c5cfc',
              }}
            >
              <div>
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-extrabold text-sm text-[#e8e8f0] truncate">
                    {note.title}
                  </h4>
                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-[#8888a8] hover:text-rose-400 transition-opacity"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-xs text-[#8888a8] whitespace-pre-wrap leading-relaxed line-clamp-6">
                  {note.content}
                </p>
              </div>

              <div className="pt-3 mt-4 border-t border-[#2a2a4a]/40 text-[10px] text-[#5a5a78]">
                {new Date(note.updatedAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Note Modal */}
      {isAddOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        >
          <div className="bg-[#12122a] border border-[#2a2a4a] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="font-extrabold text-base text-[#e8e8f0]">
              {t('addNote', lang)}
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-[#8888a8] block mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Summary of Lecture 3"
                  className="w-full px-3 py-2 rounded-xl bg-[#1c1c3a] border border-[#2a2a4a] text-xs text-[#e8e8f0] focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#8888a8] block mb-1">
                  Notes / Content
                </label>
                <textarea
                  rows={5}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your study notes and formulas..."
                  className="w-full px-3 py-2 rounded-xl bg-[#1c1c3a] border border-[#2a2a4a] text-xs text-[#e8e8f0] focus:outline-none focus:border-purple-500 resize-none leading-relaxed"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsAddOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#1c1c3a] text-xs font-bold text-[#8888a8] hover:text-[#e8e8f0]"
              >
                {t('cancel', lang)}
              </button>
              <button
                onClick={handleAddNote}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/30"
              >
                {t('save', lang)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
