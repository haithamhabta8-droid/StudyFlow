import React from 'react';
import { Gem } from 'lucide-react';

interface StudyFlowLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const DiamondIcon: React.FC<{ className?: string; strokeWidth?: number }> = ({
  className = 'w-5 h-5',
  strokeWidth = 2,
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M2 12l4-8h12l4 8-10 8z" />
  </svg>
);

export const StudyFlowLogo: React.FC<StudyFlowLogoProps> = ({
  className = '',
  size = 'md',
  showText = false,
}) => {
  const sizeClasses = {
    sm: 'w-7 h-7 rounded-lg',
    md: 'w-9 h-9 rounded-xl',
    lg: 'w-12 h-12 rounded-2xl',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <div
        className={`${sizeClasses[size]} bg-purple-950/40 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-md shadow-purple-950/40 shrink-0`}
      >
        <DiamondIcon
          className={`${iconSizes[size]} text-purple-400 drop-shadow-[0_0_6px_rgba(168,85,247,0.4)]`}
        />
      </div>
      {showText && (
        <span className="font-extrabold tracking-tight text-[#e8e8f0] font-sans">
          StudyFlow
        </span>
      )}
    </div>
  );
};

