import React, { useState } from 'react';
import { Plus, Calendar, Clock, MapPin, Trash2, Edit3, X } from 'lucide-react';
import { Category, Exam } from '../types/index.ts';
import { daysUntil } from '../utils/calculations.ts';
import { t } from '../utils/translations.ts';

interface ExamsViewProps {
  category: Category;
  lang: 'ar' | 'en';
  onUpdateCategory: (updated: Category) => void;
}

function formatExamDate(dateStr: string, lang: 'ar' | 'en'): string {
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export const ExamsView: React.FC<ExamsViewProps> = ({
  category,
  lang,
  onUpdateCategory,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');

  const exams = category.exams || [];

  const handleOpenAdd = () => {
    setEditingExamId(null);
    setTitle('');
    setDate('');
    setTime('');
    setLocation('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (exam: Exam) => {
    setEditingExamId(exam.id);
    setTitle(exam.title);
    setDate(exam.date);
    setTime(exam.time || '');
    setLocation(exam.location || '');
    setIsModalOpen(true);
  };

  const handleSaveExam = () => {
    if (!title.trim() || !date) return;

    if (editingExamId) {
      // Update existing exam
      const updatedExams = exams.map((ex) =>
        ex.id === editingExamId
          ? {
              ...ex,
              title: title.trim(),
              date,
              time: time || undefined,
              location: location.trim() || undefined,
            }
          : ex
      );
      onUpdateCategory({ ...category, exams: updatedExams });
    } else {
      // Create new exam
      const newExam: Exam = {
        id: Math.random().toString(36).slice(2, 9),
        title: title.trim(),
        date,
        time: time || undefined,
        location: location.trim() || undefined,
        created: Date.now(),
      };
      onUpdateCategory({ ...category, exams: [...exams, newExam] });
    }

    setIsModalOpen(false);
    setEditingExamId(null);
  };

  const handleDeleteExam = (id: string) => {
    if (!window.confirm(lang === 'ar' ? 'هل تريد بالتأكيد حذف هذا الامتحان؟' : 'Delete this exam?')) return;
    onUpdateCategory({ ...category, exams: exams.filter((x) => x.id !== id) });
  };

  return (
    <div className="space-y-6">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#12122a] border border-[#2a2a4a] p-4 rounded-2xl">
        <h2 className="text-base font-extrabold text-[#e8e8f0]">
          {t('tabExams', lang)} ({exams.length})
        </h2>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/30 transition-all hover:scale-105 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>{t('addExam', lang)}</span>
        </button>
      </div>

      {/* Exams Grid */}
      {exams.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#12122a] border border-dashed border-[#2a2a4a] text-[#8888a8] space-y-3">
          <Calendar className="w-10 h-10 mx-auto text-[#5a5a78]" />
          <h4 className="font-extrabold text-sm text-[#e8e8f0]">
            {t('noExams', lang)}
          </h4>
          <p className="text-xs max-w-sm mx-auto">{t('noExamsSub', lang)}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {exams.map((exam) => {
            const days = daysUntil(exam.date);
            const isNear = days >= 0 && days <= 3;
            const isPast = days < 0;

            return (
              <div
                key={exam.id}
                className="group relative p-5 rounded-2xl bg-[#12122a] border border-[#2a2a4a] hover:border-purple-500/40 transition-all flex flex-col justify-between shadow-sm"
              >
                {/* Actions: Edit and Delete */}
                <div className="absolute top-4 end-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleOpenEdit(exam)}
                    className="p-1 rounded-lg text-[#8888a8] hover:text-purple-400 hover:bg-[#1c1c3a] transition-colors"
                    title={lang === 'ar' ? 'تعديل الاختبار' : 'Edit Exam'}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteExam(exam.id)}
                    className="p-1 rounded-lg text-[#8888a8] hover:text-rose-400 hover:bg-[#1c1c3a] transition-colors"
                    title={lang === 'ar' ? 'حذف الاختبار' : 'Delete Exam'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center shrink-0 border ${
                        isNear
                          ? 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                          : isPast
                          ? 'bg-[#1c1c3a] border-[#2a2a4a] text-[#5a5a78]'
                          : 'bg-purple-500/15 border-purple-500/30 text-purple-400'
                      }`}
                    >
                      <span className="font-mono text-xl font-extrabold leading-none">
                        {Math.abs(days)}
                      </span>
                      <span className="text-[10px] font-bold uppercase mt-0.5">
                        {days === 0
                          ? t('dueToday', lang)
                          : isPast
                          ? 'ago'
                          : t('daysLeft', lang)}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1 pe-12">
                      <h4 className="font-extrabold text-sm text-[#e8e8f0] truncate">
                        {exam.title}
                      </h4>
                      <div className="flex items-center gap-1.5 text-xs text-[#8888a8] mt-1 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-purple-400" />
                        <span>{formatExamDate(exam.date, lang)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-[#2a2a4a]/40 text-xs text-[#8888a8]">
                    {exam.time && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-[#5a5a78]" />
                        <span>{exam.time}</span>
                      </div>
                    )}
                    {exam.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-[#5a5a78]" />
                        <span>{exam.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add or Edit Exam Modal */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        >
          <div className="bg-[#12122a] border border-[#2a2a4a] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-[#e8e8f0]">
                {editingExamId
                  ? lang === 'ar'
                    ? 'تعديل موعد الاختبار'
                    : 'Edit Exam'
                  : t('newExam', lang)}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#8888a8] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-[#8888a8] block mb-1">
                  {t('examTitle', lang)}
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Midterm Exam / Final Biology"
                  className="w-full px-3 py-2 rounded-xl bg-[#1c1c3a] border border-[#2a2a4a] text-xs text-[#e8e8f0] focus:outline-none focus:border-purple-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#8888a8] block mb-1">
                    {t('examDate', lang)}
                  </label>
                  <input
                    type="date"
                    required
                    style={{ colorScheme: 'dark' }}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#1c1c3a] border border-[#2a2a4a] text-xs text-[#e8e8f0] focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#8888a8] block mb-1">
                    {t('examTime', lang)}
                  </label>
                  <input
                    type="time"
                    style={{ colorScheme: 'dark' }}
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#1c1c3a] border border-[#2a2a4a] text-xs text-[#e8e8f0] focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#8888a8] block mb-1">
                  {t('location', lang)}
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., Hall 4B, Room 201, or Online"
                  className="w-full px-3 py-2 rounded-xl bg-[#1c1c3a] border border-[#2a2a4a] text-xs text-[#e8e8f0] focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#1c1c3a] text-xs font-bold text-[#8888a8] hover:text-[#e8e8f0]"
              >
                {t('cancel', lang)}
              </button>
              <button
                onClick={handleSaveExam}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/30"
              >
                {editingExamId ? (lang === 'ar' ? 'تحديث' : 'Update') : t('save', lang)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
