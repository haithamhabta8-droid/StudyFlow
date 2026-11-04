import React from 'react';
import {
  FolderPlus,
  Pin,
  Trash2,
  Settings,
  User,
  PanelLeftClose,
  PanelLeft,
  LayoutDashboard,
  Search,
  Sparkles,
} from 'lucide-react';
import { Category, UserProfile } from '../types/index.ts';
import { t } from '../utils/translations.ts';

interface SidebarProps {
  categories: Category[];
  pinnedIds: string[];
  currentCatId: string | null;
  currentTab: string;
  lang: 'ar' | 'en';
  profile: UserProfile;
  isOpenMobile: boolean;
  isCollapsedDesktop: boolean;
  onSelectCategory: (id: string) => void;
  onOpenNewCategory: () => void;
  onTogglePin: (id: string) => void;
  onDeleteCategory: (id: string) => void;
  onGoHome: () => void;
  onOpenSearch: () => void;
  onOpenProfile: () => void;
  onOpenSettings: () => void;
  onToggleCollapseDesktop: () => void;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  categories,
  pinnedIds,
  currentCatId,
  currentTab,
  lang,
  profile,
  isOpenMobile,
  isCollapsedDesktop,
  onSelectCategory,
  onOpenNewCategory,
  onTogglePin,
  onDeleteCategory,
  onGoHome,
  onOpenSearch,
  onOpenProfile,
  onOpenSettings,
  onToggleCollapseDesktop,
  onCloseMobile,
}) => {
  const isRTL = lang === 'ar';

  const pinnedCategories = categories.filter((c) => pinnedIds.includes(c.id));

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          role="presentation"
          onClick={onCloseMobile}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Persistent Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 start-0 z-50 flex flex-col w-72 bg-[#12122a] border-e border-[#2a2a4a] transition-transform duration-300 ease-in-out ${
          isOpenMobile
            ? 'translate-x-0'
            : isCollapsedDesktop
            ? isRTL
              ? 'translate-x-full'
              : '-translate-x-full'
            : isRTL
            ? 'translate-x-full lg:translate-x-0'
            : '-translate-x-full lg:translate-x-0'
        }`}
        style={{
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-[#2a2a4a]/80 shrink-0">
          <button
            onClick={onGoHome}
            className="flex items-center gap-3 text-start group focus:outline-none"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-purple-500/25 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-[#e8e8f0] block">
                StudyFlow
              </span>
              <span className="text-[10px] text-purple-400 font-semibold tracking-wider uppercase block">
                Workspace
              </span>
            </div>
          </button>

          <div className="flex items-center gap-1">
            <button
              onClick={onOpenSearch}
              title={t('searchTitle', lang)}
              aria-label={t('searchTitle', lang)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8888a8] hover:text-[#e8e8f0] hover:bg-[#1c1c3a] transition-colors"
            >
              <Search className="w-4 h-4" />
            </button>
            <button
              onClick={onToggleCollapseDesktop}
              title="Collapse"
              aria-label="Toggle Sidebar"
              className="hidden lg:flex w-8 h-8 rounded-lg items-center justify-center text-[#8888a8] hover:text-[#e8e8f0] hover:bg-[#1c1c3a] transition-colors"
            >
              {isCollapsedDesktop ? (
                <PanelLeft className="w-4 h-4" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Action Button */}
        <div className="p-3 shrink-0">
          <button
            onClick={onOpenNewCategory}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600/20 via-purple-600/30 to-teal-500/20 hover:from-purple-600/30 hover:to-teal-500/30 border border-purple-500/30 text-[#e8e8f0] font-bold text-sm shadow-md shadow-purple-900/20 hover:shadow-purple-700/30 transition-all hover:-translate-y-0.5 active:translate-y-0"
          >
            <FolderPlus className="w-4 h-4 text-purple-400" />
            <span>{t('newCategory', lang)}</span>
          </button>
        </div>

        {/* Navigation / Scrollable Area */}
        <div className="flex-1 overflow-y-auto px-3 py-1 space-y-4">
          {/* Dashboard Home Shortcut */}
          <div>
            <button
              onClick={onGoHome}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                currentTab === 'home' && !currentCatId
                  ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                  : 'text-[#8888a8] hover:bg-[#1c1c3a] hover:text-[#e8e8f0]'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-purple-400 shrink-0" />
              <span className="flex-1 text-start">{t('home', lang)}</span>
            </button>
          </div>

          {/* Pinned Section */}
          {pinnedCategories.length > 0 && (
            <div>
              <div className="flex items-center justify-between px-3 py-1 text-[11px] font-bold text-[#5a5a78] uppercase tracking-wider">
                <span>{t('pinned', lang)}</span>
                <span>{pinnedCategories.length}</span>
              </div>
              <div className="space-y-1 mt-1">
                {pinnedCategories.map((cat) => {
                  const isActive = currentCatId === cat.id && currentTab !== 'home';
                  const totalCards = (cat.decks || []).reduce(
                    (acc, d) => acc + (d.cards?.length || 0),
                    0
                  );

                  return (
                    <div
                      key={cat.id}
                      onClick={() => onSelectCategory(cat.id)}
                      className={`group flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-[#1c1c3a] text-white shadow-sm border-s-4'
                          : 'text-[#8888a8] hover:bg-[#1c1c3a]/70 hover:text-[#e8e8f0]'
                      }`}
                      style={{
                        borderInlineStartColor: isActive ? cat.color : 'transparent',
                      }}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="flex-1 truncate text-start">
                        {lang === 'ar' ? cat.name : cat.nameEn || cat.name}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onTogglePin(cat.id);
                        }}
                        title={t('unpin', lang)}
                        aria-label={t('unpin', lang)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:text-purple-400 transition-opacity"
                      >
                        <Pin className="w-3.5 h-3.5 fill-purple-400 text-purple-400" />
                      </button>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[#1c1c3a] text-[#5a5a78]">
                        {totalCards}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Categories List */}
          <div>
            <div className="flex items-center justify-between px-3 py-1 text-[11px] font-bold text-[#5a5a78] uppercase tracking-wider">
              <span>{t('categories', lang)}</span>
              <span className="px-1.5 py-0.5 rounded bg-[#1c1c3a] text-[10px] text-[#8888a8]">
                {categories.length}
              </span>
            </div>

            <div className="space-y-1 mt-1">
              {categories.length === 0 ? (
                <div className="p-4 text-center text-xs text-[#5a5a78] italic">
                  {t('noCategories', lang)}
                </div>
              ) : (
                categories.map((cat) => {
                  const isActive = currentCatId === cat.id && currentTab !== 'home';
                  const isPinned = pinnedIds.includes(cat.id);
                  const totalCards = (cat.decks || []).reduce(
                    (acc, d) => acc + (d.cards?.length || 0),
                    0
                  );

                  return (
                    <div
                      key={cat.id}
                      onClick={() => onSelectCategory(cat.id)}
                      className={`group flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-[#1c1c3a] text-white shadow-sm border-s-4'
                          : 'text-[#8888a8] hover:bg-[#1c1c3a]/70 hover:text-[#e8e8f0]'
                      }`}
                      style={{
                        borderInlineStartColor: isActive ? cat.color : 'transparent',
                      }}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="flex-1 truncate text-start">
                        {lang === 'ar' ? cat.name : cat.nameEn || cat.name}
                      </span>

                      {/* Hover Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onTogglePin(cat.id);
                          }}
                          title={isPinned ? t('unpin', lang) : t('pin', lang)}
                          aria-label={isPinned ? t('unpin', lang) : t('pin', lang)}
                          className="p-1 hover:text-purple-400 transition-colors"
                        >
                          <Pin
                            className={`w-3.5 h-3.5 ${
                              isPinned ? 'fill-purple-400 text-purple-400' : ''
                            }`}
                          />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(t('deleteConfirm', lang))) {
                              onDeleteCategory(cat.id);
                            }
                          }}
                          title="Delete"
                          aria-label="Delete Category"
                          className="p-1 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <span className="text-xs px-2 py-0.5 rounded-full bg-[#1c1c3a] text-[#5a5a78]">
                        {totalCards}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer / User Profile */}
        <div className="p-3 border-t border-[#2a2a4a] bg-[#12122a] shrink-0">
          <div className="flex items-center justify-between p-2 rounded-xl hover:bg-[#1c1c3a] transition-colors">
            <button
              onClick={onOpenProfile}
              className="flex items-center gap-3 min-w-0 flex-1 text-start focus:outline-none"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-500 to-teal-400 flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden shadow-inner">
                {profile.avatar ? (
                  <img
                    src={profile.avatar}
                    alt={profile.name || 'User'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  profile.name?.charAt(0).toUpperCase() || <User className="w-4 h-4" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-[#e8e8f0] truncate">
                  {profile.name || (lang === 'ar' ? 'طالب ذكي' : 'Student')}
                </div>
                <div className="text-[11px] text-[#8888a8] truncate">
                  {profile.email || t('profile', lang)}
                </div>
              </div>
            </button>

            <button
              onClick={onOpenSettings}
              title={t('settings', lang)}
              aria-label={t('settings', lang)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8888a8] hover:text-[#e8e8f0] hover:bg-[#242448] transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
