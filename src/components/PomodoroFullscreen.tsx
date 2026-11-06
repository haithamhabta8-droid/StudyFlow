import React from 'react';
import { Play, Pause, RotateCcw, FastForward, Eye, EyeOff, X, Coffee, Brain } from 'lucide-react';
import { formatTimer } from '../utils/calculations.ts';
import { t } from '../utils/translations.ts';

interface PomodoroFullscreenProps {
  isOpen: boolean;
  timeLeft: number;
  totalDuration: number;
  isRunning: boolean;
  mode: 'focus' | 'break';
  breaksCount: number;
  hideTime: boolean;
  lang: 'ar' | 'en';
  onTogglePlay: () => void;
  onReset: () => void;
  onSkip: () => void;
  onToggleHideTime: () => void;
  onClose: () => void;
}

export const PomodoroFullscreen: React.FC<PomodoroFullscreenProps> = ({
  isOpen,
  timeLeft,
  totalDuration,
  isRunning,
  mode,
  breaksCount,
  hideTime,
  lang,
  onTogglePlay,
  onReset,
  onSkip,
  onToggleHideTime,
  onClose,
}) => {
  if (!isOpen) return null;

  const progress = totalDuration > 0 ? (totalDuration - timeLeft) / totalDuration : 0;
  const strokeDashoffset = 880 - 880 * progress;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Pomodoro Focus Mode"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a1a]/95 backdrop-blur-xl p-4 sm:p-6"
    >
      {/* Close button */}
      <button
        onClick={onClose}
        title={t('exitFullscreen', lang)}
        aria-label={t('exitFullscreen', lang)}
        className="absolute top-6 end-6 w-12 h-12 rounded-2xl bg-[#12122a] border border-[#2a2a4a] flex items-center justify-center text-[#8888a8] hover:text-rose-400 hover:border-rose-500/40 transition-all hover:rotate-90"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="flex flex-col items-center max-w-lg w-full text-center space-y-8">
        {/* Mode Pill Indicator */}
        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#1c1c3a] border border-[#2a2a4a] text-sm font-extrabold uppercase tracking-widest text-purple-300 shadow-lg shadow-purple-950/40">
          {mode === 'focus' ? (
            <>
              <Brain className="w-4 h-4 text-purple-400" />
              <span>{t('focus', lang)}</span>
            </>
          ) : (
            <>
              <Coffee className="w-4 h-4 text-teal-400" />
              <span>{t('break', lang)}</span>
            </>
          )}
        </div>

        {/* Circular Progress Ring */}
        <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            {/* Background track circle */}
            <circle
              cx="50%"
              cy="50%"
              r="140"
              stroke="#1c1c3a"
              strokeWidth="10"
              fill="transparent"
            />
            {/* Animated progress circle */}
            <circle
              cx="50%"
              cy="50%"
              r="140"
              stroke={mode === 'focus' ? 'var(--primary)' : 'var(--accent)'}
              strokeWidth="12"
              strokeLinecap="round"
              fill="transparent"
              strokeDasharray="880"
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-linear"
              style={{
                filter:
                  mode === 'focus'
                    ? 'drop-shadow(0 0 16px rgba(124, 92, 252, 0.45))'
                    : 'drop-shadow(0 0 16px rgba(0, 212, 170, 0.45))',
              }}
            />
          </svg>

          {/* Center Digital Readout */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            {hideTime ? (
              <span className="text-3xl font-extrabold tracking-widest text-[#8888a8]">
                ••:••
              </span>
            ) : (
              <span className="text-6xl sm:text-7xl font-extrabold font-mono text-[#e8e8f0] tracking-tight">
                {formatTimer(timeLeft)}
              </span>
            )}
            <span className="text-xs font-semibold text-[#8888a8] mt-2">
              {mode === 'focus' ? '25:00' : '05:00'}
            </span>
          </div>
        </div>

        {/* Info stats */}
        <div className="flex items-center justify-center gap-8 text-xs sm:text-sm text-[#8888a8] font-medium">
          <div>
            <span>{t('nextBreak', lang)}: </span>
            <strong className="text-[#e8e8f0] font-mono">05:00</strong>
          </div>
          <div className="w-1.5 h-1.5 rounded-full bg-[#2a2a4a]" />
          <div>
            <span>{t('breaksDone', lang)}: </span>
            <strong className="text-[#e8e8f0] font-mono">{breaksCount}</strong>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={onTogglePlay}
            className={`flex items-center gap-2 px-8 py-3.5 rounded-2xl text-white font-extrabold text-base shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all ${
              mode === 'break'
                ? 'bg-teal-500 hover:bg-teal-400 text-[#052a22] shadow-teal-500/25'
                : 'bg-purple-600 hover:bg-purple-500 shadow-purple-600/35'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-5 h-5 fill-current" />
                <span>
                  {mode === 'break'
                    ? lang === 'ar'
                      ? 'إيقاف الاستراحة'
                      : 'Pause Break'
                    : lang === 'ar'
                    ? 'إيقاف التركيز'
                    : 'Pause Focus'}
                </span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" />
                <span>
                  {mode === 'break'
                    ? timeLeft < totalDuration
                      ? lang === 'ar'
                        ? 'استئناف الاستراحة'
                        : 'Resume Break'
                      : lang === 'ar'
                      ? 'بدء الاستراحة'
                      : 'Start Break'
                    : timeLeft < totalDuration
                    ? lang === 'ar'
                      ? 'استئناف التركيز'
                      : 'Resume Focus'
                    : lang === 'ar'
                    ? 'بدء التركيز'
                    : 'Start Focus'}
                </span>
              </>
            )}
          </button>

          <button
            onClick={onReset}
            title={t('reset', lang)}
            aria-label={t('reset', lang)}
            className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-[#12122a] border border-[#2a2a4a] hover:border-purple-500/40 text-[#e8e8f0] font-bold text-sm transition-all"
          >
            <RotateCcw className="w-4 h-4 text-[#8888a8]" />
            <span>{t('reset', lang)}</span>
          </button>

          <button
            onClick={onToggleHideTime}
            title={hideTime ? t('showTime', lang) : t('hideTime', lang)}
            aria-label={hideTime ? t('showTime', lang) : t('hideTime', lang)}
            className="flex items-center gap-2 px-4 py-3.5 rounded-2xl bg-[#12122a] border border-[#2a2a4a] hover:border-purple-500/40 text-[#8888a8] hover:text-[#e8e8f0] font-bold text-sm transition-all"
          >
            {hideTime ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>

          <button
            onClick={onSkip}
            title={t('skip', lang)}
            aria-label={t('skip', lang)}
            className="flex items-center gap-2 px-4 py-3.5 rounded-2xl bg-[#12122a] border border-[#2a2a4a] hover:border-purple-500/40 text-[#8888a8] hover:text-[#e8e8f0] font-bold text-sm transition-all"
          >
            <FastForward className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
