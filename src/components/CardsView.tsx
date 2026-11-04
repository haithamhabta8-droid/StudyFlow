import React, { useState } from 'react';
import {
  Folder,
  Plus,
  Sparkles,
  ArrowLeft,
  X,
  Check,
  RotateCw,
  HelpCircle,
  Eye,
  Trash2,
} from 'lucide-react';
import { Card, Category, Deck } from '../types/index.ts';
import { getNextCardStatus } from '../utils/calculations.ts';
import { t } from '../utils/translations.ts';

interface CardsViewProps {
  category: Category;
  lang: 'ar' | 'en';
  onUpdateCategory: (updated: Category) => void;
  onOpenGenerateModal: () => void;
  onOpenNewDeckModal: () => void;
}

export const CardsView: React.FC<CardsViewProps> = ({
  category,
  lang,
  onUpdateCategory,
  onOpenGenerateModal,
  onOpenNewDeckModal,
}) => {
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [studyMode, setStudyMode] = useState<boolean>(false);
  const [studyCards, setStudyCards] = useState<Card[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [glowColor, setGlowColor] = useState<'green' | 'red' | 'blue' | null>(null);

  // Manual Card Creation Modal inside view
  const [isManualCardOpen, setIsManualCardOpen] = useState(false);
  const [manualDeckId, setManualDeckId] = useState<string>('');
  const [manualQuestion, setManualQuestion] = useState('');
  const [manualAnswer, setManualAnswer] = useState('');

  const selectedDeck = category.decks?.find((d) => d.id === selectedDeckId);

  // Start study session for a specific deck or all cards in category
  const startStudy = (cardsToStudy: Card[]) => {
    if (!cardsToStudy || cardsToStudy.length === 0) return;
    setStudyCards(cardsToStudy);
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setGlowColor(null);
    setStudyMode(true);
  };

  const handleAnswer = (knew: boolean) => {
    if (studyCards.length === 0) return;
    const currentCard = studyCards[currentCardIndex];
    const newStatus = getNextCardStatus(currentCard.status, knew);

    setGlowColor(knew ? 'green' : 'red');

    // Update card status inside category
    const updatedDecks = category.decks.map((deck) => ({
      ...deck,
      cards: deck.cards.map((c) =>
        c.id === currentCard.id
          ? {
              ...c,
              status: newStatus,
              reviews: (c.reviews || 0) + 1,
              lastReviewed: Date.now(),
            }
          : c
      ),
    }));

    const updatedCategory: Category = {
      ...category,
      decks: updatedDecks,
      log: [...(category.log || []), Date.now()],
    };
    onUpdateCategory(updatedCategory);

    setTimeout(() => {
      setGlowColor(null);
      setIsFlipped(false);
      if (currentCardIndex + 1 < studyCards.length) {
        setCurrentCardIndex((prev) => prev + 1);
      } else {
        // Study finished
        setStudyMode(false);
      }
    }, 400);
  };

  const handleShowAnswer = () => {
    setIsFlipped(true);
    setGlowColor('blue');
    setTimeout(() => setGlowColor(null), 300);
  };

  const handleSaveManualCard = () => {
    if (!manualQuestion.trim() || !manualAnswer.trim() || !manualDeckId) return;

    const newCard: Card = {
      id: Math.random().toString(36).slice(2, 9),
      q: manualQuestion.trim(),
      a: manualAnswer.trim(),
      status: 'new',
      reviews: 0,
      lastReviewed: Date.now(),
    };

    const updatedDecks = category.decks.map((d) =>
      d.id === manualDeckId ? { ...d, cards: [newCard, ...(d.cards || [])] } : d
    );

    onUpdateCategory({
      ...category,
      decks: updatedDecks,
    });

    setManualQuestion('');
    setManualAnswer('');
    setIsManualCardOpen(false);
  };

  const handleDeleteCard = (deckId: string, cardId: string) => {
    const updatedDecks = category.decks.map((d) =>
      d.id === deckId ? { ...d, cards: d.cards.filter((c) => c.id !== cardId) } : d
    );
    onUpdateCategory({ ...category, decks: updatedDecks });
  };

  const handleDeleteDeck = (deckId: string) => {
    if (!window.confirm(t('deleteConfirm', lang))) return;
    const updatedDecks = category.decks.filter((d) => d.id !== deckId);
    if (selectedDeckId === deckId) setSelectedDeckId(null);
    onUpdateCategory({ ...category, decks: updatedDecks });
  };

  const allCategoryCards = (category.decks || []).flatMap((d) => d.cards || []);

  return (
    <div className="space-y-6">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#12122a] border border-[#2a2a4a] p-4 rounded-2xl">
        <div className="flex items-center gap-3">
          {selectedDeckId ? (
            <button
              onClick={() => setSelectedDeckId(null)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1c1c3a] border border-[#2a2a4a] text-xs font-bold text-[#8888a8] hover:text-[#e8e8f0] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
              <span>{t('tabCards', lang)}</span>
            </button>
          ) : (
            <h2 className="text-base font-extrabold text-[#e8e8f0]">
              {t('tabCards', lang)} ({allCategoryCards.length})
            </h2>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenGenerateModal}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-purple-600/25 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>{t('generateAI', lang)}</span>
          </button>

          <button
            onClick={onOpenNewDeckModal}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1c1c3a] border border-[#2a2a4a] hover:border-purple-500/40 text-xs font-bold text-[#e8e8f0] transition-colors"
          >
            <Folder className="w-4 h-4 text-purple-400" />
            <span>{t('newDeck', lang)}</span>
          </button>

          <button
            onClick={() => {
              if (!category.decks || category.decks.length === 0) {
                onOpenNewDeckModal();
                return;
              }
              setManualDeckId(selectedDeckId || category.decks[0].id);
              setIsManualCardOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1c1c3a] border border-[#2a2a4a] hover:border-purple-500/40 text-xs font-bold text-[#e8e8f0] transition-colors"
          >
            <Plus className="w-4 h-4 text-teal-400" />
            <span>{t('manualCard', lang)}</span>
          </button>

          {allCategoryCards.length > 0 && (
            <button
              onClick={() =>
                startStudy(selectedDeck ? selectedDeck.cards : allCategoryCards)
              }
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-[#052a22] font-extrabold text-xs shadow-md shadow-teal-500/20 transition-all"
            >
              <RotateCw className="w-4 h-4" />
              <span>{t('studyMode', lang)}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content: Single Deck View OR Decks Grid */}
      {selectedDeck ? (
        /* Selected Deck View */
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-[#12122a] border border-[#2a2a4a]">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: selectedDeck.color || category.color }}
              >
                <Folder className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-[#e8e8f0]">
                  {selectedDeck.name}
                </h3>
                <span className="text-xs text-[#8888a8]">
                  {selectedDeck.cards.length} {t('cards', lang)} ·{' '}
                  {selectedDeck.cards.filter((c) => c.status === 'mastered').length}{' '}
                  {t('mastered', lang)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => startStudy(selectedDeck.cards)}
                disabled={selectedDeck.cards.length === 0}
                className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-40 text-[#052a22] font-extrabold text-xs shadow-md transition-all"
              >
                {t('studyMode', lang)}
              </button>
            </div>
          </div>

          {selectedDeck.cards.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-[#12122a] border border-dashed border-[#2a2a4a] text-[#8888a8] space-y-3">
              <HelpCircle className="w-10 h-10 mx-auto text-[#5a5a78]" />
              <h4 className="font-extrabold text-sm text-[#e8e8f0]">
                {t('noCardsInDeck', lang)}
              </h4>
              <p className="text-xs max-w-sm mx-auto">{t('noCardsInDeckSub', lang)}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedDeck.cards.map((card) => (
                <div
                  key={card.id}
                  className="group relative p-4 rounded-2xl bg-[#12122a] border border-[#2a2a4a] hover:border-purple-500/40 transition-all hover:-translate-y-0.5 space-y-3"
                  style={{
                    borderInlineStartWidth: '4px',
                    borderInlineStartColor: selectedDeck.color || category.color,
                  }}
                >
                  <button
                    onClick={() => handleDeleteCard(selectedDeck.id, card.id)}
                    className="absolute top-3 end-3 opacity-0 group-hover:opacity-100 p-1 text-[#8888a8] hover:text-rose-400 transition-opacity"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <div className="font-bold text-sm text-[#e8e8f0] leading-snug line-clamp-3">
                    {card.q}
                  </div>
                  <div className="text-xs text-[#8888a8] line-clamp-3 leading-relaxed">
                    {card.a}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#2a2a4a]/40 text-[11px]">
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold ${
                        card.status === 'mastered'
                          ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20'
                          : card.status === 'learning'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-[#1c1c3a] text-[#8888a8]'
                      }`}
                    >
                      {card.status === 'mastered'
                        ? t('mastered', lang)
                        : card.status === 'learning'
                        ? t('learning', lang)
                        : t('newCards', lang)}
                    </span>
                    <span className="text-[#5a5a78]">
                      {card.reviews || 0} reviews
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Decks Grid */
        <div>
          {(!category.decks || category.decks.length === 0) ? (
            <div className="p-12 text-center rounded-2xl bg-[#12122a] border border-dashed border-[#2a2a4a] text-[#8888a8] space-y-3">
              <Folder className="w-10 h-10 mx-auto text-[#5a5a78]" />
              <h4 className="font-extrabold text-sm text-[#e8e8f0]">
                {t('noDecks', lang)}
              </h4>
              <p className="text-xs max-w-sm mx-auto">{t('noDecksSub', lang)}</p>
              <div className="pt-2">
                <button
                  onClick={onOpenNewDeckModal}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs"
                >
                  {t('newDeck', lang)}
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {category.decks.map((deck) => {
                const total = deck.cards?.length || 0;
                const mastered = deck.cards?.filter((c) => c.status === 'mastered').length || 0;
                const previewText = deck.cards?.[0]?.q || '';

                return (
                  <div
                    key={deck.id}
                    onClick={() => setSelectedDeckId(deck.id)}
                    className="relative cursor-pointer group transition-transform duration-200 hover:-translate-y-1.5"
                  >
                    {/* Layered stack 3D effect */}
                    <div className="absolute -top-2 inset-x-4 h-4 rounded-t-xl bg-[#1c1c3a] border border-[#2a2a4a] pointer-events-none opacity-80" />
                    <div className="absolute -top-1 inset-x-2 h-4 rounded-t-xl bg-[#242448] border border-[#2a2a4a] pointer-events-none opacity-90" />

                    <div className="relative z-10 p-5 rounded-2xl bg-[#12122a] border border-[#2a2a4a] group-hover:border-purple-500/50 shadow-lg shadow-black/30 flex flex-col justify-between min-h-[170px]">
                      {/* Delete deck button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteDeck(deck.id);
                        }}
                        className="absolute top-4 end-4 opacity-0 group-hover:opacity-100 p-1 rounded-lg text-[#8888a8] hover:text-rose-400 hover:bg-[#1c1c3a] transition-all"
                        title="Delete Deck"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <div className="flex items-start gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm"
                          style={{ backgroundColor: deck.color || category.color }}
                        >
                          <Folder className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-extrabold text-sm text-[#e8e8f0] truncate">
                            {deck.name}
                          </h4>
                          <span className="text-[11px] text-[#8888a8]">
                            {deck.source || 'Manual Deck'}
                          </span>
                        </div>
                      </div>

                      <div className="my-2">
                        <p className="text-xs text-[#8888a8] line-clamp-2 italic">
                          {previewText ? `"${previewText}"` : '—'}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-[#2a2a4a]/50 text-xs">
                        <span className="font-bold text-purple-400">
                          {total} {t('cards', lang)}
                        </span>
                        <span className="text-[#8888a8] font-medium">
                          {mastered} {t('mastered', lang)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Manual Card Creation Modal */}
      {isManualCardOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        >
          <div className="bg-[#12122a] border border-[#2a2a4a] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-[#e8e8f0]">
                {t('newCard', lang)}
              </h3>
              <button
                onClick={() => setIsManualCardOpen(false)}
                className="text-[#8888a8] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-[#8888a8] block mb-1">
                  {t('chooseDeck', lang)}
                </label>
                <select
                  value={manualDeckId}
                  onChange={(e) => setManualDeckId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#1c1c3a] border border-[#2a2a4a] text-xs font-semibold text-[#e8e8f0] focus:outline-none focus:border-purple-500"
                >
                  {category.decks?.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#8888a8] block mb-1">
                  {t('question', lang)}
                </label>
                <textarea
                  rows={2}
                  value={manualQuestion}
                  onChange={(e) => setManualQuestion(e.target.value)}
                  placeholder="e.g., What is photosynthesis?"
                  className="w-full px-3 py-2 rounded-xl bg-[#1c1c3a] border border-[#2a2a4a] text-xs text-[#e8e8f0] focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#8888a8] block mb-1">
                  {t('answer', lang)}
                </label>
                <textarea
                  rows={3}
                  value={manualAnswer}
                  onChange={(e) => setManualAnswer(e.target.value)}
                  placeholder="e.g., Process used by plants to convert light energy into chemical energy..."
                  className="w-full px-3 py-2 rounded-xl bg-[#1c1c3a] border border-[#2a2a4a] text-xs text-[#e8e8f0] focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsManualCardOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#1c1c3a] text-xs font-bold text-[#8888a8] hover:text-[#e8e8f0]"
              >
                {t('cancel', lang)}
              </button>
              <button
                onClick={handleSaveManualCard}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/30"
              >
                {t('save', lang)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3D Study Mode Modal */}
      {studyMode && studyCards.length > 0 && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md p-4 sm:p-6"
        >
          {/* Header */}
          <div className="w-full max-w-xl flex items-center justify-between text-xs font-bold text-[#8888a8] mb-4">
            <span>
              {currentCardIndex + 1} / {studyCards.length}
            </span>
            <button
              onClick={() => setStudyMode(false)}
              className="px-3 py-1.5 rounded-xl bg-[#1c1c3a] hover:bg-[#242448] text-[#e8e8f0] transition-colors"
            >
              {t('finish', lang)}
            </button>
          </div>

          {/* 3D Card Stage */}
          <div className="w-full max-w-xl h-80 sm:h-96 perspective-1000">
            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className={`relative w-full h-full cursor-pointer rounded-3xl transition-transform duration-500 transform-style-3d shadow-2xl ${
                isFlipped ? 'rotate-y-180' : ''
              } ${
                glowColor === 'green'
                  ? 'ring-4 ring-teal-400 shadow-[0_0_50px_rgba(0,212,170,0.4)]'
                  : glowColor === 'red'
                  ? 'ring-4 ring-rose-500 shadow-[0_0_50px_rgba(255,77,106,0.4)]'
                  : glowColor === 'blue'
                  ? 'ring-4 ring-purple-500 shadow-[0_0_50px_rgba(124,92,252,0.4)]'
                  : ''
              }`}
            >
              {/* Front Face (Question) */}
              <div className="absolute inset-0 backface-hidden rounded-3xl bg-gradient-to-br from-[#1a1a3a] to-[#251f44] border border-[#2a2a4a] p-8 flex flex-col justify-between items-center text-center">
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-purple-400">
                  {t('question', lang)}
                </span>
                <div className="my-auto font-extrabold text-lg sm:text-2xl text-[#e8e8f0] leading-relaxed max-h-48 overflow-y-auto px-2">
                  {studyCards[currentCardIndex]?.q}
                </div>
                <span className="text-xs text-[#8888a8] italic">
                  {t('clickToFlip', lang)}
                </span>
              </div>

              {/* Back Face (Answer) */}
              <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-3xl bg-[#12122a] border border-teal-500/40 p-8 flex flex-col justify-between items-center text-center">
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-teal-400">
                  {t('answer', lang)}
                </span>
                <div className="my-auto font-medium text-base sm:text-lg text-[#e8e8f0] leading-relaxed max-h-48 overflow-y-auto px-2">
                  {studyCards[currentCardIndex]?.a}
                </div>
                <span className="text-xs text-[#8888a8]">StudyFlow SRS</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-6 w-full max-w-xl">
            <button
              onClick={() => handleAnswer(false)}
              className="flex-1 max-w-[140px] flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 hover:bg-rose-500/25 font-extrabold text-xs transition-all active:scale-95"
            >
              <X className="w-4 h-4" />
              <span>{t('dontKnow', lang)}</span>
            </button>

            <button
              onClick={handleShowAnswer}
              className="px-5 py-3 rounded-2xl bg-[#1c1c3a] border border-[#2a2a4a] hover:border-purple-500/40 text-[#e8e8f0] font-bold text-xs flex items-center gap-2 transition-all active:scale-95"
            >
              <Eye className="w-4 h-4 text-purple-400" />
              <span>{t('showAnswer', lang)}</span>
            </button>

            <button
              onClick={() => handleAnswer(true)}
              className="flex-1 max-w-[140px] flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-teal-500 hover:bg-teal-400 text-[#052a22] font-extrabold text-xs shadow-lg shadow-teal-500/25 transition-all active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>{t('know', lang)}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
