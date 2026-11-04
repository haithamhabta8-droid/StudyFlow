import React, { useState } from 'react';
import { Plus, Check, Trash2, Calendar, AlertCircle } from 'lucide-react';
import { Category, Task } from '../types/index.ts';
import { t } from '../utils/translations.ts';

interface TasksViewProps {
  category: Category;
  lang: 'ar' | 'en';
  showCompleted: boolean;
  onToggleShowCompleted: (v: boolean) => void;
  onUpdateCategory: (updated: Category) => void;
}

export const TasksView: React.FC<TasksViewProps> = ({
  category,
  lang,
  showCompleted,
  onToggleShowCompleted,
  onUpdateCategory,
}) => {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [due, setDue] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');

  const tasks = category.tasks || [];
  const filteredTasks = showCompleted ? tasks : tasks.filter((t) => !t.done);

  const handleToggleTask = (id: string) => {
    const updated = tasks.map((tk) =>
      tk.id === id ? { ...tk, done: !tk.done } : tk
    );
    onUpdateCategory({ ...category, tasks: updated });
  };

  const handleDeleteTask = (id: string) => {
    const updated = tasks.filter((tk) => tk.id !== id);
    onUpdateCategory({ ...category, tasks: updated });
  };

  const handleAddTask = () => {
    if (!title.trim()) return;
    const newTask: Task = {
      id: Math.random().toString(36).slice(2, 9),
      title: title.trim(),
      due: due || undefined,
      priority,
      done: false,
      created: Date.now(),
    };
    onUpdateCategory({ ...category, tasks: [newTask, ...tasks] });
    setTitle('');
    setDue('');
    setPriority('medium');
    setIsAddOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#12122a] border border-[#2a2a4a] p-4 rounded-2xl">
        <h2 className="text-base font-extrabold text-[#e8e8f0]">
          {t('tabTasks', lang)} ({tasks.filter((t) => !t.done).length})
        </h2>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs font-semibold text-[#8888a8] cursor-pointer">
            <input
              type="checkbox"
              checked={showCompleted}
              onChange={(e) => onToggleShowCompleted(e.target.checked)}
              className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 bg-[#1c1c3a] border-[#2a2a4a]"
            />
            <span>{t('showCompleted', lang)}</span>
          </label>

          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{t('addTask', lang)}</span>
          </button>
        </div>
      </div>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#12122a] border border-dashed border-[#2a2a4a] text-[#8888a8] space-y-3">
          <Check className="w-10 h-10 mx-auto text-[#5a5a78]" />
          <h4 className="font-extrabold text-sm text-[#e8e8f0]">
            {t('noTasks', lang)}
          </h4>
          <p className="text-xs max-w-sm mx-auto">{t('noTasksSub', lang)}</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredTasks.map((tk) => {
            const isDueToday =
              tk.due &&
              new Date(tk.due).toISOString().slice(0, 10) ===
                new Date().toISOString().slice(0, 10);
            const isOverdue =
              tk.due &&
              !tk.done &&
              new Date(tk.due) < new Date(new Date().toDateString());

            return (
              <div
                key={tk.id}
                className={`group flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                  tk.done
                    ? 'bg-[#12122a]/50 border-[#2a2a4a]/40 opacity-60'
                    : 'bg-[#12122a] border-[#2a2a4a] hover:border-purple-500/40'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <button
                    onClick={() => handleToggleTask(tk.id)}
                    className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors shrink-0 ${
                      tk.done
                        ? 'bg-teal-500 border-teal-500 text-[#052a22]'
                        : 'border-[#3a3a5a] hover:border-purple-500'
                    }`}
                  >
                    {tk.done && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </button>
                  <span
                    className={`text-sm font-semibold truncate ${
                      tk.done ? 'line-through text-[#8888a8]' : 'text-[#e8e8f0]'
                    }`}
                  >
                    {tk.title}
                  </span>
                </div>

                <div className="flex items-center gap-3 shrink-0 ms-2">
                  {tk.due && (
                    <span
                      className={`text-xs font-mono font-bold flex items-center gap-1 ${
                        isOverdue
                          ? 'text-rose-400'
                          : isDueToday
                          ? 'text-amber-400'
                          : 'text-[#8888a8]'
                      }`}
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      {tk.due}
                    </span>
                  )}

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      tk.priority === 'high'
                        ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                        : tk.priority === 'medium'
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                        : 'bg-[#1c1c3a] text-[#8888a8]'
                    }`}
                  >
                    {t(tk.priority, lang)}
                  </span>

                  <button
                    onClick={() => handleDeleteTask(tk.id)}
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

      {/* Add Task Modal */}
      {isAddOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        >
          <div className="bg-[#12122a] border border-[#2a2a4a] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="font-extrabold text-base text-[#e8e8f0]">
              {t('newTask', lang)}
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-[#8888a8] block mb-1">
                  {t('taskTitle', lang)}
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Read chapter 4 and solve exercises"
                  className="w-full px-3 py-2 rounded-xl bg-[#1c1c3a] border border-[#2a2a4a] text-xs text-[#e8e8f0] focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#8888a8] block mb-1">
                    {t('dueDate', lang)}
                  </label>
                  <input
                    type="date"
                    value={due}
                    onChange={(e) => setDue(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#1c1c3a] border border-[#2a2a4a] text-xs text-[#e8e8f0] focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#8888a8] block mb-1">
                    {t('priority', lang)}
                  </label>
                  <select
                    value={priority}
                    onChange={(e) =>
                      setPriority(e.target.value as 'low' | 'medium' | 'high')
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#1c1c3a] border border-[#2a2a4a] text-xs text-[#e8e8f0] focus:outline-none focus:border-purple-500"
                  >
                    <option value="low">{t('low', lang)}</option>
                    <option value="medium">{t('medium', lang)}</option>
                    <option value="high">{t('high', lang)}</option>
                  </select>
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
                onClick={handleAddTask}
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
