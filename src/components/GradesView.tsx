import React, { useState } from 'react';
import { Plus, Award, Trash2 } from 'lucide-react';
import { Category, Grade } from '../types/index.ts';
import { calculateWeightedGPA } from '../utils/calculations.ts';
import { t } from '../utils/translations.ts';

interface GradesViewProps {
  category: Category;
  lang: 'ar' | 'en';
  onUpdateCategory: (updated: Category) => void;
}

export const GradesView: React.FC<GradesViewProps> = ({
  category,
  lang,
  onUpdateCategory,
}) => {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [score, setScore] = useState<number>(0);
  const [maxScore, setMaxScore] = useState<number>(100);
  const [weight, setWeight] = useState<number>(20);

  const grades = category.grades || [];
  const gpaInfo = calculateWeightedGPA(grades);

  const handleAddGrade = () => {
    if (!title.trim() || maxScore <= 0) return;
    const newGrade: Grade = {
      id: Math.random().toString(36).slice(2, 9),
      title: title.trim(),
      score: Number(score),
      maxScore: Number(maxScore),
      weight: Number(weight),
      created: Date.now(),
    };
    onUpdateCategory({ ...category, grades: [...grades, newGrade] });
    setTitle('');
    setScore(0);
    setMaxScore(100);
    setWeight(20);
    setIsAddOpen(false);
  };

  const handleDeleteGrade = (id: string) => {
    onUpdateCategory({ ...category, grades: grades.filter((x) => x.id !== id) });
  };

  return (
    <div className="space-y-6">
      {/* Top GPA Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#12122a] border border-[#2a2a4a] flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 font-mono text-2xl font-extrabold shrink-0">
            {gpaInfo.gpa}%
          </div>
          <div>
            <span className="text-xs font-bold text-[#8888a8] uppercase tracking-wider block">
              {t('avg', lang)}
            </span>
            <span className="text-xl font-extrabold text-[#e8e8f0]">
              Grade: {gpaInfo.letter}
            </span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#12122a] border border-[#2a2a4a] flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 font-mono text-2xl font-extrabold shrink-0">
            {grades.length}
          </div>
          <div>
            <span className="text-xs font-bold text-[#8888a8] uppercase tracking-wider block">
              {t('graded', lang)}
            </span>
            <span className="text-sm font-semibold text-[#8888a8]">
              {gpaInfo.totalWeight}% weight counted
            </span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#12122a] border border-[#2a2a4a] flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-[#8888a8] block mb-1">
              Add Assessment
            </span>
            <p className="text-xs text-[#5a5a78]">Record scores & weights</p>
          </div>
          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{t('addGrade', lang)}</span>
          </button>
        </div>
      </div>

      {/* Grades List */}
      {grades.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#12122a] border border-dashed border-[#2a2a4a] text-[#8888a8] space-y-3">
          <Award className="w-10 h-10 mx-auto text-[#5a5a78]" />
          <h4 className="font-extrabold text-sm text-[#e8e8f0]">
            {t('noGrades', lang)}
          </h4>
          <p className="text-xs max-w-sm mx-auto">{t('noGradesSub', lang)}</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {grades.map((gr) => {
            const pct = Math.round((gr.score / gr.maxScore) * 100);

            return (
              <div
                key={gr.id}
                className="group flex items-center justify-between p-4 rounded-2xl bg-[#12122a] border border-[#2a2a4a] hover:border-purple-500/40 transition-all"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-sm text-[#e8e8f0] truncate">
                      {gr.title}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-md bg-[#1c1c3a] text-[#8888a8] font-mono">
                      Weight: {gr.weight}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#8888a8] mt-1 font-mono">
                    <span>
                      {gr.score} / {gr.maxScore}
                    </span>
                    <span>•</span>
                    <span
                      className={`font-bold ${
                        pct >= 85
                          ? 'text-teal-400'
                          : pct >= 70
                          ? 'text-purple-400'
                          : pct >= 60
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {pct}%
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={`font-mono font-extrabold text-sm px-3 py-1 rounded-xl border ${
                      pct >= 85
                        ? 'bg-teal-500/10 border-teal-500/30 text-teal-400'
                        : pct >= 70
                        ? 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                        : pct >= 60
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                    }`}
                  >
                    {pct >= 90
                      ? 'A+'
                      : pct >= 85
                      ? 'A'
                      : pct >= 80
                      ? 'B+'
                      : pct >= 75
                      ? 'B'
                      : pct >= 70
                      ? 'C+'
                      : pct >= 65
                      ? 'C'
                      : pct >= 60
                      ? 'D'
                      : 'F'}
                  </span>

                  <button
                    onClick={() => handleDeleteGrade(gr.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-[#8888a8] hover:text-rose-400 transition-opacity"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Grade Modal */}
      {isAddOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        >
          <div className="bg-[#12122a] border border-[#2a2a4a] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="font-extrabold text-base text-[#e8e8f0]">
              {t('newGrade', lang)}
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-[#8888a8] block mb-1">
                  {t('assessment', lang)}
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Midterm Exam / Quiz 1"
                  className="w-full px-3 py-2 rounded-xl bg-[#1c1c3a] border border-[#2a2a4a] text-xs text-[#e8e8f0] focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#8888a8] block mb-1">
                    {t('score', lang)}
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={score}
                    onChange={(e) => setScore(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[#1c1c3a] border border-[#2a2a4a] text-xs text-[#e8e8f0] focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#8888a8] block mb-1">
                    {t('maxScore', lang)}
                  </label>
                  <input
                    type="number"
                    value={maxScore}
                    onChange={(e) => setMaxScore(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[#1c1c3a] border border-[#2a2a4a] text-xs text-[#e8e8f0] focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#8888a8] block mb-1">
                    {t('weight', lang)}
                  </label>
                  <input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[#1c1c3a] border border-[#2a2a4a] text-xs text-[#e8e8f0] focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>
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
                onClick={handleAddGrade}
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
