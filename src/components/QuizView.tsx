import React, { useState } from 'react';
import { Sparkles, HelpCircle, Check, X, ArrowRight, Award, Trash2, RefreshCw } from 'lucide-react';
import { Category, Quiz, QuizQuestion } from '../types/index.ts';
import { t } from '../utils/translations.ts';
import { getGeminiApiKey, generateQuizWithAI } from '../utils/gemini.ts';

interface QuizViewProps {
  category: Category;
  lang: 'ar' | 'en';
  onUpdateCategory: (updated: Category) => void;
}

export const QuizView: React.FC<QuizViewProps> = ({
  category,
  lang,
  onUpdateCategory,
}) => {
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isFinished, setIsFinished] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const quizzes = category.quizzes || [];

  const handleGenerateQuiz = async () => {
    setIsGenerating(true);
    const allCards = (category.decks || []).flatMap((d) => d.cards || []);
    let questions: QuizQuestion[] = [];

    const apiKey = getGeminiApiKey();
    if (apiKey) {
      try {
        const studyContext = allCards.length > 0
          ? allCards.slice(0, 10).map((c) => `Q: ${c.q} | A: ${c.a}`).join('\n')
          : `Subject: ${category.name}`;
        const aiQuestions = await generateQuizWithAI(studyContext, 4, lang);
        questions = aiQuestions.map((q, idx) => ({
          id: `ai-q-${idx}-${Date.now()}`,
          question: q.question,
          options: q.options,
          correctIndex: q.correctIndex,
        }));
      } catch (err) {
        console.warn('Gemini quiz generation fallback:', err);
      }
    }

    if (questions.length === 0) {
      if (allCards.length >= 3) {
        questions = allCards.slice(0, 4).map((card, i) => {
          const otherCards = allCards.filter((c) => c.id !== card.id);
          const distractors = otherCards.slice(0, 3).map((c) => c.a);
          const options = [card.a, ...distractors].sort(() => Math.random() - 0.5);
          return {
            id: `q-${i}`,
            question: card.q,
            options,
            correctIndex: options.indexOf(card.a),
          };
        });
      } else {
        questions = [
          {
            id: 'q-1',
            question: lang === 'ar' ? `ما هو المفهوم الأساسي في ${category.name}؟` : `What is the core concept of ${category.name}?`,
            options: ['Fundamental Principle', 'Secondary Assumption', 'Random Hypothesis', 'Peripheral Feature'],
            correctIndex: 0,
          },
          {
            id: 'q-2',
            question: lang === 'ar' ? 'ما هي الخطوة الأولى الموصى بها في مراجعة المادة؟' : 'What is the first step recommended when studying this topic?',
            options: ['Active Recall & Spaced Repetition', 'Passive Skimming', 'Ignoring Summaries', 'Cramming all night'],
            correctIndex: 0,
          },
          {
            id: 'q-3',
            question: lang === 'ar' ? 'كيف تقيس إتقانك للبطاقات؟' : 'How do you measure card mastery?',
            options: ['By consistent correct recall across intervals', 'By memorizing once', 'By color tagging', 'By reviewing only before exams'],
            correctIndex: 0,
          },
        ];
      }
    }

    const newQuiz: Quiz = {
      id: Math.random().toString(36).slice(2, 9),
      title: `${category.name} Quiz #${quizzes.length + 1}`,
      questions,
      created: Date.now(),
    };

    onUpdateCategory({ ...category, quizzes: [newQuiz, ...quizzes] });
    setActiveQuiz(newQuiz);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setIsFinished(false);
    setIsGenerating(false);
  };

  const handleSelectOption = (optionIndex: number) => {
    if (selectedAnswers[currentQuestionIndex] !== undefined) return;
    const nextAnswers = { ...selectedAnswers, [currentQuestionIndex]: optionIndex };
    setSelectedAnswers(nextAnswers);
  };

  const handleNext = () => {
    if (!activeQuiz) return;
    if (currentQuestionIndex + 1 < activeQuiz.questions.length) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      // Calculate score
      let correct = 0;
      activeQuiz.questions.forEach((q, idx) => {
        if (selectedAnswers[idx] === q.correctIndex) correct++;
      });
      const score = Math.round((correct / activeQuiz.questions.length) * 100);

      const updatedQuizzes = quizzes.map((q) =>
        q.id === activeQuiz.id ? { ...q, score } : q
      );
      onUpdateCategory({ ...category, quizzes: updatedQuizzes });
      setIsFinished(true);
    }
  };

  const handleDeleteQuiz = (id: string) => {
    onUpdateCategory({ ...category, quizzes: quizzes.filter((q) => q.id !== id) });
    if (activeQuiz?.id === id) setActiveQuiz(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#12122a] border border-[#2a2a4a] p-4 rounded-2xl">
        <h2 className="text-base font-extrabold text-[#e8e8f0]">
          {t('tabQuiz', lang)} ({quizzes.length})
        </h2>

        <button
          onClick={handleGenerateQuiz}
          disabled={isGenerating}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-purple-600/30 transition-all"
        >
          {isGenerating ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          <span>{isGenerating ? (lang === 'ar' ? 'جارٍ التوليد بالذكاء الاصطناعي...' : 'Generating Quiz...') : t('generateQuiz', lang)}</span>
        </button>
      </div>

      {/* Active Quiz Taking Modal/Area */}
      {activeQuiz && (
        <div className="p-6 rounded-2xl bg-[#12122a] border border-purple-500/40 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-[#2a2a4a] pb-3">
            <div>
              <h3 className="font-extrabold text-base text-[#e8e8f0]">
                {activeQuiz.title}
              </h3>
              <span className="text-xs text-[#8888a8]">
                {t('question', lang)} {currentQuestionIndex + 1} of{' '}
                {activeQuiz.questions.length}
              </span>
            </div>
            <button
              onClick={() => setActiveQuiz(null)}
              className="text-xs font-bold text-[#8888a8] hover:text-[#e8e8f0]"
            >
              Close
            </button>
          </div>

          {!isFinished ? (
            <div className="space-y-4">
              <h4 className="text-lg font-bold text-[#e8e8f0]">
                {activeQuiz.questions[currentQuestionIndex].question}
              </h4>

              <div className="space-y-2.5">
                {activeQuiz.questions[currentQuestionIndex].options.map(
                  (opt, optIdx) => {
                    const answered = selectedAnswers[currentQuestionIndex] !== undefined;
                    const isSelected =
                      selectedAnswers[currentQuestionIndex] === optIdx;
                    const isCorrect =
                      optIdx ===
                      activeQuiz.questions[currentQuestionIndex].correctIndex;

                    return (
                      <button
                        key={optIdx}
                        disabled={answered}
                        onClick={() => handleSelectOption(optIdx)}
                        className={`w-full p-3.5 rounded-xl border text-start font-medium text-xs sm:text-sm transition-all flex items-center justify-between ${
                          !answered
                            ? 'bg-[#1c1c3a] border-[#2a2a4a] hover:border-purple-500 text-[#e8e8f0]'
                            : isCorrect
                            ? 'bg-teal-500/20 border-teal-500 text-teal-300 font-bold'
                            : isSelected
                            ? 'bg-rose-500/20 border-rose-500 text-rose-300 font-bold'
                            : 'bg-[#1c1c3a] border-[#2a2a4a] text-[#8888a8] opacity-50'
                        }`}
                      >
                        <span>{opt}</span>
                        {answered && isCorrect && (
                          <Check className="w-4 h-4 text-teal-400 shrink-0" />
                        )}
                        {answered && isSelected && !isCorrect && (
                          <X className="w-4 h-4 text-rose-400 shrink-0" />
                        )}
                      </button>
                    );
                  }
                )}
              </div>

              {selectedAnswers[currentQuestionIndex] !== undefined && (
                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleNext}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-all"
                  >
                    <span>
                      {currentQuestionIndex + 1 === activeQuiz.questions.length
                        ? t('finish', lang)
                        : t('next', lang)}
                    </span>
                    <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="py-6 text-center space-y-4">
              <Award className="w-12 h-12 mx-auto text-teal-400" />
              <h4 className="text-xl font-extrabold text-[#e8e8f0]">
                {t('quizDone', lang)}
              </h4>
              <p className="text-sm text-[#8888a8]">
                You scored{' '}
                <strong className="text-teal-400 font-mono text-lg">
                  {activeQuiz.score || 0}%
                </strong>
              </p>
              <button
                onClick={() => setActiveQuiz(null)}
                className="px-6 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs"
              >
                {t('done', lang)}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Quizzes List */}
      {quizzes.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#12122a] border border-dashed border-[#2a2a4a] text-[#8888a8] space-y-3">
          <HelpCircle className="w-10 h-10 mx-auto text-[#5a5a78]" />
          <h4 className="font-extrabold text-sm text-[#e8e8f0]">
            {t('noQuiz', lang)}
          </h4>
          <p className="text-xs max-w-sm mx-auto">{t('noQuizSub', lang)}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quizzes.map((qz) => (
            <div
              key={qz.id}
              className="p-5 rounded-2xl bg-[#12122a] border border-[#2a2a4a] hover:border-purple-500/40 transition-all flex flex-col justify-between"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-extrabold text-sm text-[#e8e8f0]">
                    {qz.title}
                  </h4>
                  <span className="text-xs text-[#8888a8]">
                    {qz.questions.length} {t('questions', lang)}
                  </span>
                </div>
                <button
                  onClick={() => handleDeleteQuiz(qz.id)}
                  className="p-1 text-[#8888a8] hover:text-rose-400"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center justify-between pt-4 mt-4 border-t border-[#2a2a4a]/40">
                <span
                  className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full ${
                    qz.score !== undefined
                      ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20'
                      : 'bg-[#1c1c3a] text-[#8888a8]'
                  }`}
                >
                  {qz.score !== undefined ? `${qz.score}%` : 'Not taken'}
                </span>

                <button
                  onClick={() => {
                    setActiveQuiz(qz);
                    setCurrentQuestionIndex(0);
                    setSelectedAnswers({});
                    setIsFinished(false);
                  }}
                  className="text-xs font-bold text-purple-400 hover:text-purple-300"
                >
                  {qz.score !== undefined ? 'Retake' : 'Start'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
