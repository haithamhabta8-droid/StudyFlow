import React, { useState } from 'react';
import { Sparkles, Check, Coffee } from 'lucide-react';
import { Category } from '../../types/index.ts';
import { t } from '../../utils/translations.ts';

interface SessionEndModalProps {
  isOpen: boolean;
  categories: Category[];
  currentCatId: string | null;
  durationMinutes: number;
  lang: 'ar' | 'en';
  onSaveSession: (categoryId: string, note: string, generateQuiz: boolean) => void;
  onDismiss: () => void;
}

export const SessionEndModal: React.FC<SessionEndModalProps> = ({
  isOpen,
  categories,
  currentCatId,
  durationMinutes,
  lang,
  onSaveSession,
  onDismiss,
}) => {
  const [selectedCatId, setSelectedCatId] = useState<string>(
    currentCatId || categories[0]?.id || ''
  );
  const [summary, setSummary] = useState('');
  const [createQuiz, setCreateQuiz] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveSession(selectedCatId, summary.trim(), createQuiz);
    setSummary('');
    setCreateQuiz(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
    >
      <div className="bg-[#12122a] border border-purple-500/40 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0">
            <Coffee className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-[#e8e8f0]">
              {t('sessionDone', lang)}
            </h3>
            <span className="text-xs text-teal-400 font-bold">
              +{durationMinutes} {t('minutes', lang)} {t('studied', lang)}!
            </span>
          </div>
        </div>

        <p className="text-xs text-[#8888a8] leading-relaxed">
          {t('sessionPrompt', lang)}
        </p>

        <div className="space-y-3">
          {categories.length > 0 && (
            <div>
              <label className="text-xs font-bold text-[#8888a8] block mb-1">
                Subject
              </label>
              <select
                value={selectedCatId}
                onChange={(e) => setSelectedCatId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#1c1c3a] border border-[#2a2a4a] text-xs font-semibold text-[#e8e8f0] focus:outline-none focus:border-purple-500"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {lang === 'ar' ? c.name : c.nameEn || c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <textarea
              rows={3}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="e.g., Reviewed chapter 3 limits & solved 5 derivatives..."
              className="w-full px-3 py-2 rounded-xl bg-[#1c1c3a] border border-[#2a2a4a] text-xs text-[#e8e8f0] focus:outline-none focus:border-purple-500 resize-none leading-relaxed"
            />
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold text-[#8888a8] cursor-pointer">
            <input
              type="checkbox"
              checked={createQuiz}
              onChange={(e) => setCreateQuiz(e.target.checked)}
              className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 bg-[#1c1c3a] border-[#2a2a4a]"
            />
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>{t('quizFromSession', lang)}</span>
            </span>
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            onClick={onDismiss}
            className="px-4 py-2 rounded-xl bg-[#1c1c3a] text-xs font-bold text-[#8888a8] hover:text-[#e8e8f0]"
          >
            Skip
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/30"
          >
            <Check className="w-4 h-4" />
            <span>{t('save', lang)}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
