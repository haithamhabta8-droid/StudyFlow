import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { PRIMARY_COLORS } from '../../utils/storage.ts';
import { t } from '../../utils/translations.ts';

interface CategoryModalProps {
  isOpen: boolean;
  lang: 'ar' | 'en';
  onClose: () => void;
  onCreate: (name: string, subject: string, color: string) => void;
}

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  lang,
  onClose,
  onCreate,
}) => {
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [color, setColor] = useState(PRIMARY_COLORS[0]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate(name.trim(), subject.trim(), color);
    setName('');
    setSubject('');
    setColor(PRIMARY_COLORS[0]);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
    >
      <div className="bg-[#12122a] border border-[#2a2a4a] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-base text-[#e8e8f0]">
            {t('newCategory', lang)}
          </h3>
          <button
            onClick={onClose}
            className="text-[#8888a8] hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-[#8888a8] block mb-1">
              {t('categoryName', lang)}
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Mathematics / Biology"
              className="w-full px-3 py-2.5 rounded-xl bg-[#1c1c3a] border border-[#2a2a4a] text-xs text-[#e8e8f0] focus:outline-none focus:border-purple-500 font-semibold"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#8888a8] block mb-1">
              {t('subject', lang)}
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g., Semester 1 - Prof. Miller"
              className="w-full px-3 py-2.5 rounded-xl bg-[#1c1c3a] border border-[#2a2a4a] text-xs text-[#e8e8f0] focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#8888a8] block mb-2">
              {t('color', lang)}
            </label>
            <div className="flex flex-wrap gap-2">
              {PRIMARY_COLORS.map((c) => {
                const isSelected = color === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    style={{ backgroundColor: c }}
                    className={`w-7 h-7 rounded-lg transition-transform flex items-center justify-center text-white ${
                      isSelected ? 'ring-2 ring-white scale-110' : 'hover:scale-105'
                    }`}
                  >
                    {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#1c1c3a] text-xs font-bold text-[#8888a8] hover:text-[#e8e8f0]"
            >
              {t('cancel', lang)}
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/30"
            >
              {t('create', lang)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
