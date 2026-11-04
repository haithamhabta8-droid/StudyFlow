import React, { useState } from 'react';
import { Search, X, Folder, Layers, CheckSquare, Calendar } from 'lucide-react';
import { Category } from '../../types/index.ts';
import { t } from '../../utils/translations.ts';

interface SearchModalProps {
  isOpen: boolean;
  categories: Category[];
  lang: 'ar' | 'en';
  onClose: () => void;
  onNavigate: (categoryId: string, tab: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  categories,
  lang,
  onClose,
  onNavigate,
}) => {
  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();

  const results: {
    id: string;
    type: 'cat' | 'card' | 'task' | 'exam';
    title: string;
    sub: string;
    categoryId: string;
    tab: string;
  }[] = [];

  if (q) {
    categories.forEach((c) => {
      const cName = (lang === 'ar' ? c.name : c.nameEn || c.name).toLowerCase();
      if (cName.includes(q)) {
        results.push({
          id: `cat-${c.id}`,
          type: 'cat',
          title: lang === 'ar' ? c.name : c.nameEn || c.name,
          sub: 'Category',
          categoryId: c.id,
          tab: 'overview',
        });
      }

      (c.tasks || []).forEach((tk) => {
        if (tk.title.toLowerCase().includes(q)) {
          results.push({
            id: `task-${tk.id}`,
            type: 'task',
            title: tk.title,
            sub: `Task in ${lang === 'ar' ? c.name : c.nameEn || c.name}`,
            categoryId: c.id,
            tab: 'tasks',
          });
        }
      });

      (c.exams || []).forEach((ex) => {
        if (ex.title.toLowerCase().includes(q)) {
          results.push({
            id: `exam-${ex.id}`,
            type: 'exam',
            title: ex.title,
            sub: `Exam in ${lang === 'ar' ? c.name : c.nameEn || c.name}`,
            categoryId: c.id,
            tab: 'exams',
          });
        }
      });

      (c.decks || []).forEach((d) => {
        (d.cards || []).forEach((k) => {
          if (
            k.q.toLowerCase().includes(q) ||
            k.a.toLowerCase().includes(q)
          ) {
            results.push({
              id: `card-${k.id}`,
              type: 'card',
              title: k.q,
              sub: `Card in ${d.name} (${lang === 'ar' ? c.name : c.nameEn || c.name})`,
              categoryId: c.id,
              tab: 'cards',
            });
          }
        });
      });
    });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 backdrop-blur-sm p-4 pt-16"
    >
      <div className="bg-[#12122a] border border-[#2a2a4a] rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
        <div className="flex items-center gap-3 bg-[#1c1c3a] border border-[#2a2a4a] px-3.5 py-2.5 rounded-xl">
          <Search className="w-5 h-5 text-purple-400 shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('searchPlaceholder', lang)}
            className="w-full bg-transparent text-xs sm:text-sm text-[#e8e8f0] focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-[#8888a8] hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Results */}
        <div className="max-h-72 overflow-y-auto space-y-1.5 pt-1">
          {!q ? (
            <div className="py-8 text-center text-xs text-[#5a5a78]">
              {lang === 'ar' ? 'اكتب كلمة للبحث في المواد والبطاقات والمهام' : 'Type to search across subjects, flashcards, and tasks'}
            </div>
          ) : results.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#8888a8]">
              {lang === 'ar' ? 'لا توجد نتائج مطابقة' : 'No matching results found'}
            </div>
          ) : (
            results.map((r) => (
              <div
                key={r.id}
                onClick={() => {
                  onNavigate(r.categoryId, r.tab);
                  onClose();
                }}
                className="flex items-center gap-3 p-3 rounded-xl bg-[#1c1c3a] hover:bg-[#242448] cursor-pointer transition-colors"
              >
                <div className="p-2 rounded-lg bg-[#12122a] text-purple-400 shrink-0">
                  {r.type === 'cat' && <Folder className="w-4 h-4" />}
                  {r.type === 'card' && <Layers className="w-4 h-4" />}
                  {r.type === 'task' && <CheckSquare className="w-4 h-4" />}
                  {r.type === 'exam' && <Calendar className="w-4 h-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="font-bold text-xs text-[#e8e8f0] block truncate">
                    {r.title}
                  </span>
                  <span className="text-[11px] text-[#8888a8] block truncate">
                    {r.sub}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex justify-end pt-2 border-t border-[#2a2a4a]/40">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-[#1c1c3a] text-xs font-bold text-[#8888a8] hover:text-[#e8e8f0]"
          >
            {t('done', lang)}
          </button>
        </div>
      </div>
    </div>
  );
};
