import React, { useState, useEffect } from 'react';
import { X, Sparkles, AlertCircle, ArrowUpRight, FolderPlus, Loader2, BookOpen } from 'lucide-react';
import { Card, Category } from '../../types/index.ts';
import { t } from '../../utils/translations.ts';
import { getGeminiApiKey, generateFlashcardsWithAI } from '../../utils/gemini.ts';

interface GenerateModalProps {
  isOpen: boolean;
  categories: Category[];
  currentCatId: string | null;
  lang: 'ar' | 'en';
  onClose: () => void;
  onOpenSettings?: () => void;
  onOpenNewCategory?: () => void;
  onGenerated: (categoryId: string, deckName: string, cards: Card[]) => void;
}

export const GenerateModal: React.FC<GenerateModalProps> = ({
  isOpen,
  categories,
  currentCatId,
  lang,
  onClose,
  onOpenSettings,
  onOpenNewCategory,
  onGenerated,
}) => {
  const [selectedCatId, setSelectedCatId] = useState<string>(
    currentCatId || categories[0]?.id || ''
  );
  const [deckName, setDeckName] = useState('');
  const [text, setText] = useState('');
  const [cardCount, setCardCount] = useState<number>(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync selectedCatId whenever categories or currentCatId changes
  useEffect(() => {
    if (categories.length > 0) {
      if (!selectedCatId || !categories.some((c) => c.id === selectedCatId)) {
        setSelectedCatId(currentCatId || categories[0].id);
      }
    } else {
      setSelectedCatId('');
    }
  }, [categories, currentCatId, selectedCatId]);

  if (!isOpen) return null;

  const apiKey = getGeminiApiKey();
  const hasCategories = categories.length > 0;

  const handleGenerate = async () => {
    if (!text.trim()) {
      setErrorMsg(
        lang === 'ar'
          ? 'يرجى إدخال محتوى دراسي أو تلخيص لتوليد البطاقات.'
          : 'Please paste your study notes, summary, or topic text.'
      );
      return;
    }

    if (!selectedCatId) {
      setErrorMsg(
        lang === 'ar'
          ? 'يرجى اختيار مادة أو إنشاء مادة جديدة أولاً.'
          : 'Please select a subject or create one first.'
      );
      return;
    }

    setErrorMsg(null);
    setIsGenerating(true);

    const finalDeckName =
      deckName.trim() ||
      (lang === 'ar'
        ? `توليد ذكي (${new Date().toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })})`
        : `AI Flashcards (${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`);

    if (apiKey) {
      try {
        const aiCards = await generateFlashcardsWithAI(text, cardCount, lang);

        if (!aiCards || aiCards.length === 0) {
          throw new Error('No flashcards were generated. Please try again with more detailed text.');
        }

        const formatted: Card[] = aiCards.map((c) => ({
          id: Math.random().toString(36).slice(2, 9),
          q: c.q,
          a: c.a,
          status: 'new',
          reviews: 0,
          lastReviewed: Date.now(),
        }));

        onGenerated(selectedCatId, finalDeckName, formatted);
        setIsGenerating(false);
        setText('');
        setDeckName('');
        onClose();
        return;
      } catch (err: any) {
        console.warn('Gemini generation failed:', err);
        setErrorMsg(err?.message || 'Gemini error. Please check your API key in Settings.');
        setIsGenerating(false);
        return;
      }
    }

    // If no API key configured, prompt user to add in settings
    setErrorMsg(t('pleaseAddKey', lang));
    setIsGenerating(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
    >
      <div className="bg-[#12122a] border border-[#2a2a4a] rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <h3 className="font-extrabold text-base text-[#e8e8f0]">
              {t('generateCardsTitle', lang)}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#8888a8] hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-[#8888a8] leading-relaxed">
          {t('generateCardsSub', lang)}
        </p>

        {/* API Key Status Notice */}
        {!apiKey ? (
          <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/30 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-purple-200">
              <AlertCircle className="w-4 h-4 text-purple-400 shrink-0" />
              <span>{t('pleaseAddKey', lang)}</span>
            </div>
            {onOpenSettings && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSettings();
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-[11px] shrink-0 transition-all"
              >
                <span>{t('settings', lang)}</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            )}
          </div>
        ) : (
          <div className="text-[11px] text-teal-400 font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            <span>Gemini AI Engine Active (gemini-3.8-flash)</span>
          </div>
        )}

        {/* Missing Categories Guard Warning */}
        {!hasCategories ? (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-3">
            <div className="flex items-start gap-2.5">
              <FolderPlus className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm text-amber-300">
                  {lang === 'ar' ? 'يجب إضافة تصنيف أولاً' : 'Add a Category First'}
                </p>
                <p className="text-amber-200/80 text-xs mt-1 leading-relaxed">
                  {lang === 'ar'
                    ? 'لتوليد بطاقات الذكاء الاصطناعي، تحتاج إلى مادة أو تصنيف لحفظ مجموعات البطاقات بداخلها.'
                    : 'To store your generated flashcards, you need at least one subject or category in your workspace.'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onOpenNewCategory) {
                  onOpenNewCategory();
                }
              }}
              className="w-full py-2.5 px-3 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
            >
              <FolderPlus className="w-4 h-4" />
              <span>{lang === 'ar' ? 'إضافة تصنيف جديد الآن' : '+ Create New Category Now'}</span>
            </button>
          </div>
        ) : (
          <>
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-3.5">
              {/* Category Select */}
              <div>
                <label className="text-xs font-bold text-[#8888a8] block mb-1">
                  {t('categories', lang)}
                </label>
                <select
                  value={selectedCatId}
                  onChange={(e) => setSelectedCatId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#1c1c3a] border border-[#2a2a4a] text-xs font-semibold text-[#e8e8f0] focus:outline-none focus:border-purple-500 transition-colors"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {lang === 'ar' ? c.name : c.nameEn || c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Deck Name */}
              <div>
                <label className="text-xs font-bold text-[#8888a8] block mb-1">
                  {t('deckName', lang)}
                </label>
                <input
                  type="text"
                  value={deckName}
                  onChange={(e) => setDeckName(e.target.value)}
                  placeholder="e.g., Photosynthesis & Energy Transfer"
                  className="w-full px-3 py-2 rounded-xl bg-[#1c1c3a] border border-[#2a2a4a] text-xs text-[#e8e8f0] focus:outline-none focus:border-purple-500 font-semibold transition-colors"
                />
              </div>

              {/* Text to generate from */}
              <div>
                <label className="text-xs font-bold text-[#8888a8] block mb-1">
                  {t('orPasteText', lang)}
                </label>
                <textarea
                  rows={4}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Paste lecture notes, book summaries, or definitions here..."
                  className="w-full px-3 py-2 rounded-xl bg-[#1c1c3a] border border-[#2a2a4a] text-xs text-[#e8e8f0] focus:outline-none focus:border-purple-500 resize-none leading-relaxed transition-colors"
                />
              </div>

              {/* Number of cards */}
              <div>
                <label className="text-xs font-bold text-[#8888a8] block mb-1">
                  {t('numCards', lang)}
                </label>
                <select
                  value={cardCount}
                  onChange={(e) => setCardCount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-[#1c1c3a] border border-[#2a2a4a] text-xs font-semibold text-[#e8e8f0] focus:outline-none focus:border-purple-500 transition-colors"
                >
                  <option value={5}>5 Cards</option>
                  <option value={10}>10 Cards</option>
                  <option value={20}>20 Cards</option>
                </select>
              </div>
            </div>

            {isGenerating && (
              <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/30 text-purple-300 text-xs flex items-center gap-2 animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin text-purple-400 shrink-0" />
                <span>
                  {lang === 'ar'
                    ? 'قد يستغرق توليد الذكاء الاصطناعي بضع لحظات للمعالجة، يرجى الانتظار...'
                    : 'AI generation might take a few moments to process...'}
                </span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-[#1c1c3a] text-xs font-bold text-[#8888a8] hover:text-[#e8e8f0] transition-colors"
              >
                {t('cancel', lang)}
              </button>
              <button
                type="button"
                disabled={isGenerating || !text.trim() || !hasCategories}
                onClick={handleGenerate}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-purple-600/30 transition-all hover:scale-[1.02] active:scale-95"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{lang === 'ar' ? 'جارٍ التوليد...' : 'Generating with Gemini...'}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>{t('generate', lang)}</span>
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
