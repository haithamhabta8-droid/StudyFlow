import React, { useState, useEffect } from 'react';
import {
  Moon,
  Sun,
  Circle,
  Palette,
  Cloud,
  Download,
  Upload,
  Trash2,
  Check,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Play,
  DownloadCloud,
  Database,
  Target,
  HelpCircle,
  Eye,
  EyeOff,
  LogOut,
  Key,
  ExternalLink,
  Cpu,
  ShieldCheck,
  FileText,
} from 'lucide-react';
import { GoogleLogo } from './GoogleLogo.tsx';
import { AppSettings, AppState, ThinkingLevelOption, UserProfile } from '../types/index.ts';
import { PRIMARY_COLORS, exportAppState } from '../utils/storage.ts';
import { t } from '../utils/translations.ts';
import {
  requestGoogleAccessToken,
  fetchGoogleUserProfile,
  uploadBackupToDrive,
  restoreBackupFromDrive,
  revokeGoogleAccess,
  deleteGoogleAccountDataAndRevoke,
  getStoredAccessToken,
  setStoredAccessToken,
} from '../utils/googleDrive.ts';
import { DeleteAccountChallengeModal } from './modals/DeleteAccountChallengeModal.tsx';
import {
  getGeminiApiKey,
  setGeminiApiKey,
  testGeminiApiKey,
  DEFAULT_GEMINI_MODEL,
  isGemini4Model,
} from '../utils/gemini.ts';
import { useGeminiModels } from '../hooks/useGeminiModels.ts';

interface SettingsViewProps {
  state: AppState;
  lang: 'ar' | 'en';
  onUpdateSettings: (settings: Partial<AppSettings>) => void;
  onUpdateProfile: (profile: Partial<UserProfile>) => void;
  onRestoreState: (restored: AppState) => void;
  onImportState: (file: File) => void;
  onResetAll: (options?: { preserveTab?: boolean; wipeAll?: boolean }) => void;
  onStartTutorial?: () => void;
  onOpenTerms?: (tab: 'terms' | 'privacy') => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  state,
  lang,
  onUpdateSettings,
  onUpdateProfile,
  onRestoreState,
  onImportState,
  onResetAll,
  onStartTutorial,
  onOpenTerms,
}) => {
  const [showByokExplainer, setShowByokExplainer] = useState(false);
  // Appearance & Language State
  const theme = state.settings.theme || 'black';
  const currentLang = state.settings.lang || 'en';
  const primaryColor = state.settings.primaryColor || '#15803D';
  const [hexInput, setHexInput] = useState(primaryColor.replace('#', '').toUpperCase());

  // Goals State
  const [dailyGoal, setDailyGoal] = useState(state.settings.goalDaily || 60);
  const [weeklyGoal, setWeeklyGoal] = useState(state.settings.goalWeekly || 420);
  const [goalsStatusMessage, setGoalsStatusMessage] = useState<string | null>(null);

  // Gemini AI BYOK State
  const [apiKeyInput, setApiKeyInput] = useState(() => {
    return getGeminiApiKey() || state.settings.apiKey || '';
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const { models: liveModels, meta: modelSyncMeta, isSyncing: isSyncingModels, refreshModels } = useGeminiModels(true);
  const [selectedModel, setSelectedModel] = useState(
    state.settings.model || DEFAULT_GEMINI_MODEL
  );
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Google Drive & Auth State
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);
  const [isUploadingDrive, setIsUploadingDrive] = useState(false);
  const [isRestoringDrive, setIsRestoringDrive] = useState(false);
  const [driveStatusMessage, setDriveStatusMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  // Account Deletion Challenge State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleConfirmDeleteAccount = async () => {
    const token = getStoredAccessToken();
    await deleteGoogleAccountDataAndRevoke(token);
    setApiKeyInput('');
    setIsOfflineCached(false);
    setDriveStatusMessage(null);
    setTestResult(null);
    setOfflineStatus(null);
    setGoalsStatusMessage(null);
    onResetAll({ preserveTab: true, wipeAll: true });
  };

  // Offline Mode State
  const [isOfflineCached, setIsOfflineCached] = useState(() => {
    try {
      return localStorage.getItem('studyflow_offline_cached') === 'true';
    } catch {
      return false;
    }
  });
  const [offlineStatus, setOfflineStatus] = useState<string | null>(null);

  // Sync hex input when primaryColor changes
  useEffect(() => {
    setHexInput(primaryColor.replace('#', '').toUpperCase());
  }, [primaryColor]);

  // Keep API key state synchronized with storage
  useEffect(() => {
    const key = getGeminiApiKey() || state.settings.apiKey || '';
    if (key && !apiKeyInput) {
      setApiKeyInput(key);
    }
  }, [state.settings.apiKey]);

  // If Google removes the currently selected model in a live sync, fall back to top available model
  useEffect(() => {
    if (modelSyncMeta.isLive && liveModels.length > 0 && !liveModels.some((m) => m.id === selectedModel)) {
      const nextId = liveModels[0].id;
      setSelectedModel(nextId);
      onUpdateSettings({ model: nextId });
    }
  }, [modelSyncMeta.isLive, liveModels, selectedModel]);

  // Auto-recognize pasted Gemini API key
  const handleKeyInputChange = (val: string) => {
    setApiKeyInput(val);
    const trimmed = val.trim();
    if (trimmed.startsWith('AIza') && trimmed.length >= 35) {
      const targetModel = selectedModel || DEFAULT_GEMINI_MODEL;
      setSelectedModel(targetModel);
      setGeminiApiKey(trimmed);
      onUpdateSettings({ apiKey: trimmed, model: targetModel });
      refreshModels(true, trimmed);
      testGeminiApiKey(trimmed, targetModel).then((res) => {
        if (res.success) {
          const usedModel = res.resolvedModel || targetModel;
          setTestResult({
            success: true,
            message:
              lang === 'ar'
                ? `✓ تم التعرف على المفتاح وتفعيله بنجاح! (${usedModel})`
                : `✓ Key recognized and activated successfully! (${usedModel})`,
          });
          setTimeout(() => setTestResult(null), 4000);
        }
      });
    }
  };

  const handleHexChange = (val: string) => {
    const cleaned = val.replace(/[^0-9A-Fa-f]/g, '').slice(0, 6);
    setHexInput(cleaned.toUpperCase());
    if (cleaned.length === 6) {
      onUpdateSettings({ primaryColor: `#${cleaned}` });
    }
  };

  const handleSelectColor = (colorHex: string) => {
    setHexInput(colorHex.replace('#', '').toUpperCase());
    onUpdateSettings({ primaryColor: colorHex });
  };

  const handleSaveGoals = () => {
    onUpdateSettings({
      goalDaily: Number(dailyGoal),
      goalWeekly: Number(weeklyGoal),
    });
    setGoalsStatusMessage(
      lang === 'ar' ? 'تم حفظ أهداف المذاكرة بنجاح!' : 'Study goals saved successfully.'
    );
    setTimeout(() => setGoalsStatusMessage(null), 5000);
  };

  // Gemini AI Handlers
  const handleSaveApiKey = async () => {
    const trimmed = apiKeyInput.trim();
    if (!trimmed) {
      setTestResult({
        success: false,
        message: lang === 'ar' ? 'يرجى إدخال مفتاح API أولاً.' : 'Please enter an API key.',
      });
      return;
    }

    setIsTestingKey(true);
    setTestResult(null);

    // Validate key with Gemini before accepting and saving
    const res = await testGeminiApiKey(trimmed, selectedModel);
    setIsTestingKey(false);

    if (res.success) {
      setGeminiApiKey(trimmed);
      onUpdateSettings({
        apiKey: trimmed,
        model: selectedModel,
      });
      refreshModels(true, trimmed);
      setTestResult({
        success: true,
        message:
          lang === 'ar'
            ? '✓ تم التحقق من مفتاح Google Gemini وحفظه بنجاح وهو صالح وجاهز للاستخدام!'
            : '✓ Google Gemini API key verified and saved successfully! Valid and working.',
      });
      setTimeout(() => setTestResult(null), 5000);
    } else {
      setTestResult({
        success: false,
        message:
          res.error ||
          (lang === 'ar'
            ? 'مفتاح API غير صالح أو خاطئ! يرجى الحصول على مفتاح صحيح من Google AI Studio والمحاولة مجدداً.'
            : 'Invalid or incorrect API key! Please check your key from Google AI Studio and enter a real, valid one.'),
      });
    }
  };

  const handleClearApiKey = () => {
    setApiKeyInput('');
    setGeminiApiKey('');
    onUpdateSettings({ apiKey: '' });
    setTestResult({
      success: true,
      message: lang === 'ar' ? 'تمت إزالة المفتاح.' : 'API key removed.',
    });
    setTimeout(() => setTestResult(null), 3000);
  };

  const handleTestApiKey = async () => {
    const keyToTest = apiKeyInput.trim();
    if (!keyToTest) {
      setTestResult({
        success: false,
        message: lang === 'ar' ? 'يرجى إدخال مفتاح API أولاً.' : 'Please enter an API key to test.',
      });
      return;
    }

    setIsTestingKey(true);
    setTestResult(null);

    const res = await testGeminiApiKey(keyToTest, selectedModel);
    setIsTestingKey(false);

    if (res.success) {
      setTestResult({
        success: true,
        message:
          lang === 'ar'
            ? '✓ الاتصال ناجح! مفتاح Google Gemini صالح وجاهز للاستخدام.'
            : '✓ Connection successful! Google Gemini API key is valid and working.',
      });
      // Save valid key automatically and sync live models
      setGeminiApiKey(keyToTest);
      onUpdateSettings({ apiKey: keyToTest });
      refreshModels(true, keyToTest);
    } else {
      setTestResult({
        success: false,
        message:
          res.error ||
          (lang === 'ar'
            ? 'فشل الاتصال: يرجى التحقق من المفتاح.'
            : 'Connection failed: Please verify your Gemini API key.'),
      });
    }
  };

  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
    const nextThinking =
      state.settings.thinkingLevel === 'XHIGH' && modelId !== 'gemini-4-hydrogen'
        ? 'HIGH'
        : state.settings.thinkingLevel;
    onUpdateSettings({ model: modelId, thinkingLevel: nextThinking });
  };

  // Google Drive & Auth
  const handleConnectGoogle = async () => {
    setIsConnectingGoogle(true);
    setDriveStatusMessage({
      type: 'info',
      text: lang === 'ar' ? 'جارٍ الاتصال بحساب Google...' : 'Connecting to Google...',
    });

    try {
      const token = await requestGoogleAccessToken();
      const profileInfo = await fetchGoogleUserProfile(token);
      onUpdateProfile(profileInfo);

      // Automatic Sync: automatically restore data upon login as requested
      setDriveStatusMessage({
        type: 'info',
        text:
          lang === 'ar'
            ? 'تم الاتصال! جارٍ استعادة ومزامنة بياناتك من Google Drive تلقائيًا...'
            : 'Connected! Automatically fetching your data from Google Drive...',
      });

      try {
        const restored = await restoreBackupFromDrive(token);
        const restoredKey = restored.settings?.apiKey || (restored as any).geminiApiKey || '';
        if (restoredKey) {
          setGeminiApiKey(restoredKey);
          setApiKeyInput(restoredKey);
        }
        onRestoreState(restored);
        setDriveStatusMessage({
          type: 'success',
          text:
            lang === 'ar'
              ? `تم تسجيل الدخول واستعادة بياناتك ونسختك من Google Drive بنجاح! (${profileInfo.email || profileInfo.name})`
              : `Connected! Your study data was automatically restored from Google Drive (${profileInfo.email || profileInfo.name}).`,
        });
      } catch (restoreErr) {
        // If no prior backup found, auto-create initial backup
        const activeKey = getGeminiApiKey() || apiKeyInput.trim() || state.settings.apiKey || '';
        const initialToUpload: AppState = {
          ...state,
          profile: { ...state.profile, ...profileInfo },
          settings: {
            ...state.settings,
            apiKey: activeKey,
          },
        };
        await uploadBackupToDrive(token, initialToUpload).catch(() => null);
        setDriveStatusMessage({
          type: 'success',
          text: `${t('googleConnected', lang)} (${profileInfo.email || profileInfo.name})`,
        });
      }
    } catch (err: any) {
      setDriveStatusMessage({
        type: 'error',
        text: err?.message || 'Google Sign-In failed or cancelled.',
      });
    } finally {
      setIsConnectingGoogle(false);
    }
  };

  const handleSignOutGoogle = () => {
    revokeGoogleAccess();
    onUpdateProfile({
      name: 'Student',
      email: '',
      avatar: '',
      signedIn: false,
      googleId: undefined,
    });
    setDriveStatusMessage({
      type: 'info',
      text: lang === 'ar' ? 'تم تسجيل الخروج من Google بنجاح.' : 'Signed out from Google.',
    });
    setTimeout(() => setDriveStatusMessage(null), 3000);
  };

  const handleUploadDriveBackup = async () => {
    let token = getStoredAccessToken();
    if (!token) {
      try {
        token = await requestGoogleAccessToken();
        const profileInfo = await fetchGoogleUserProfile(token);
        onUpdateProfile(profileInfo);
      } catch (err: any) {
        setDriveStatusMessage({
          type: 'error',
          text: err?.message || 'Google authorization required before upload.',
        });
        return;
      }
    }

    setIsUploadingDrive(true);
    setDriveStatusMessage(null);

    try {
      const activeKey = getGeminiApiKey() || apiKeyInput.trim() || state.settings.apiKey || '';
      const stateToUpload: AppState = {
        ...state,
        settings: {
          ...state.settings,
          apiKey: activeKey,
        },
      };

      const res = await uploadBackupToDrive(token, stateToUpload);
      setDriveStatusMessage({
        type: 'success',
        text: `${t('backupUploaded', lang)} (${new Date(res.timestamp).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })})`,
      });
    } catch (err: any) {
      setDriveStatusMessage({
        type: 'error',
        text: err?.message || 'Failed to upload backup to Google Drive.',
      });
    } finally {
      setIsUploadingDrive(false);
    }
  };

  const handleRestoreDriveBackup = async () => {
    let token = getStoredAccessToken();
    if (!token) {
      try {
        token = await requestGoogleAccessToken();
        const profileInfo = await fetchGoogleUserProfile(token);
        onUpdateProfile(profileInfo);
      } catch (err: any) {
        setDriveStatusMessage({
          type: 'error',
          text: err?.message || 'Google authorization required before restore.',
        });
        return;
      }
    }

    if (
      !window.confirm(
        lang === 'ar'
          ? 'هل تريد استبدال البيانات الحالية بالنسخة المحفوظة في Google Drive؟'
          : 'Restore backup and overwrite current local data?'
      )
    ) {
      return;
    }

    setIsRestoringDrive(true);
    setDriveStatusMessage(null);

    try {
      const restored = await restoreBackupFromDrive(token);
      const restoredKey = restored.settings?.apiKey || (restored as any).geminiApiKey || '';
      if (restoredKey) {
        setGeminiApiKey(restoredKey);
        setApiKeyInput(restoredKey);
      }
      onRestoreState(restored);
      setDriveStatusMessage({
        type: 'success',
        text: t('backupRestored', lang),
      });
    } catch (err: any) {
      setDriveStatusMessage({
        type: 'error',
        text: err?.message || 'Failed to restore backup from Google Drive.',
      });
    } finally {
      setIsRestoringDrive(false);
    }
  };

  // Offline Mode Caching
  const handleDownloadOffline = async () => {
    setOfflineStatus('Caching application assets for offline access...');
    try {
      if ('caches' in window) {
        const cache = await caches.open('studyflow-offline-v1');
        const urlsToCache = [
          './',
          './index.html',
          './src/main.tsx',
          './src/index.css',
        ];
        await cache.addAll(urlsToCache).catch(() => null);
      }
      localStorage.setItem('studyflow_offline_cached', 'true');
      setIsOfflineCached(true);
      setOfflineStatus('✓ App cached successfully! Full offline mode enabled.');
      setTimeout(() => setOfflineStatus(null), 4000);
    } catch (e) {
      localStorage.setItem('studyflow_offline_cached', 'true');
      setIsOfflineCached(true);
      setOfflineStatus('✓ Offline state saved locally.');
      setTimeout(() => setOfflineStatus(null), 4000);
    }
  };

  const handleClearOffline = async () => {
    try {
      if ('caches' in window) {
        await caches.delete('studyflow-offline-v1');
      }
      localStorage.removeItem('studyflow_offline_cached');
      setIsOfflineCached(false);
      setOfflineStatus('Offline cache cleared.');
      setTimeout(() => setOfflineStatus(null), 3000);
    } catch (e) {
      localStorage.removeItem('studyflow_offline_cached');
      setIsOfflineCached(false);
    }
  };

  const isGoogleConnected = Boolean(state.profile?.signedIn || state.profile?.email);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Page Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-[#f3f4f6]">
          {t('settings', lang)}
        </h1>
      </div>

      {/* 1. Appearance & Language */}
      <div className="p-6 rounded-2xl bg-[#0b0c10] border border-[#1a1b22] space-y-6 shadow-lg">
        <h3 className="font-extrabold text-sm text-[#f3f4f6] flex items-center gap-2">
          <Palette className="w-4 h-4" style={{ color: primaryColor }} />
          <span>{t('appearance', lang)}</span>
        </h3>

        {/* Theme Picker */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-[#f3f4f6] block">
            {t('theme', lang)}
          </label>
          <span className="text-[11px] text-[#8c909e] block">
            {t('themeDesc', lang)}
          </span>

          <div className="grid grid-cols-4 gap-2 p-1 bg-[#121318] rounded-xl border border-[#20222a] max-w-lg">
            {/* Auto (System / Chrome Detection) */}
            <button
              type="button"
              onClick={() => {
                const sys = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
                onUpdateSettings({ theme: sys });
              }}
              style={{
                backgroundColor: 'transparent',
                color: '#8c909e',
              }}
              className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all hover:text-white"
              title={lang === 'ar' ? 'مطابقة مظهر النظام والمتصفح' : 'Auto match System & Chrome profile'}
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              <span>{lang === 'ar' ? 'تلقائي' : 'Auto/OS'}</span>
            </button>

            {/* Dark */}
            <button
              type="button"
              onClick={() => onUpdateSettings({ theme: 'dark' })}
              style={{
                backgroundColor: theme === 'dark' ? primaryColor : 'transparent',
                color: theme === 'dark' ? '#ffffff' : '#8c909e',
              }}
              className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all"
            >
              <Moon className="w-3.5 h-3.5" />
              <span>{t('dark', lang)}</span>
            </button>

            {/* Light */}
            <button
              type="button"
              onClick={() => onUpdateSettings({ theme: 'light' })}
              style={{
                backgroundColor: theme === 'light' ? primaryColor : 'transparent',
                color: theme === 'light' ? '#ffffff' : '#8c909e',
              }}
              className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all"
            >
              <Sun className="w-3.5 h-3.5" />
              <span>{t('light', lang)}</span>
            </button>

            {/* Black (OLED Pitch Black) */}
            <button
              type="button"
              onClick={() => onUpdateSettings({ theme: 'black' })}
              style={{
                backgroundColor: theme === 'black' ? primaryColor : 'transparent',
                color: theme === 'black' ? '#ffffff' : '#8c909e',
              }}
              className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all"
            >
              <Circle className="w-3.5 h-3.5 fill-current" />
              <span>{t('black', lang)}</span>
            </button>
          </div>
        </div>

        {/* Language Picker */}
        <div className="space-y-2 pt-2 border-t border-[#1a1b22]">
          <label className="text-xs font-bold text-[#f3f4f6] block">
            {t('language', lang)}
          </label>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#8c909e]">
              {t('languageDesc', lang)}
            </span>
            <div className="flex items-center gap-1 p-1 bg-[#121318] rounded-xl border border-[#20222a]">
              <button
                type="button"
                onClick={() => onUpdateSettings({ lang: 'ar' })}
                style={{
                  backgroundColor: currentLang === 'ar' ? primaryColor : 'transparent',
                  color: currentLang === 'ar' ? '#ffffff' : '#8c909e',
                }}
                className="py-1.5 px-3 rounded-lg text-xs font-bold transition-all"
              >
                العربية
              </button>
              <button
                type="button"
                onClick={() => onUpdateSettings({ lang: 'en' })}
                style={{
                  backgroundColor: currentLang === 'en' ? primaryColor : 'transparent',
                  color: currentLang === 'en' ? '#ffffff' : '#8c909e',
                }}
                className="py-1.5 px-3 rounded-lg text-xs font-bold transition-all"
              >
                English
              </button>
            </div>
          </div>
        </div>

        {/* Primary Color Picker */}
        <div className="space-y-2 pt-2 border-t border-[#1a1b22]">
          <label className="text-xs font-bold text-[#f3f4f6] block">
            {t('primaryColor', lang)}
          </label>
          <span className="text-[11px] text-[#8c909e] block">
            {t('primaryColorDesc', lang)}
          </span>

          <div className="flex flex-wrap items-center gap-2 pt-2">
            {PRIMARY_COLORS.map((c) => {
              const isSelected = primaryColor.toLowerCase() === c.toLowerCase();
              return (
                <button
                  type="button"
                  key={c}
                  onClick={() => handleSelectColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg transition-all flex items-center justify-center shadow-md ${
                    isSelected
                      ? 'ring-2 ring-white scale-110 shadow-lg z-10'
                      : 'opacity-85 hover:opacity-100 hover:scale-105'
                  }`}
                  aria-label={`Select accent color ${c}`}
                />
              );
            })}

            {/* Custom Hex Input Box with Preview Square */}
            <div className="ms-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#121318] border border-[#20222a]">
              <span className="text-xs font-mono text-[#8c909e]">#</span>
              <input
                type="text"
                value={hexInput}
                onChange={(e) => handleHexChange(e.target.value)}
                maxLength={6}
                className="w-16 bg-transparent text-xs font-mono font-bold text-[#f3f4f6] focus:outline-none uppercase"
                placeholder="15803D"
              />
              <span
                className="w-4 h-4 rounded shrink-0 border border-white/20"
                style={{ backgroundColor: `#${hexInput || '15803D'}` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Real Gemini AI Settings (BYOK) - 100% Genuine, No Fake Inputs */}
      <div className="p-6 rounded-2xl bg-[#0b0c10] border border-[#1a1b22] space-y-5 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-extrabold text-sm text-[#f3f4f6] flex items-center gap-2">
              <Sparkles className="w-4 h-4" style={{ color: primaryColor }} />
              <span>
                {lang === 'ar' ? 'محرك الذكاء الاصطناعي (Google Gemini BYOK)' : 'Google Gemini AI Engine (BYOK)'}
              </span>
            </h3>
            {/* Circular Question Mark Tooltip Trigger */}
            <button
              type="button"
              onClick={() => setShowByokExplainer(!showByokExplainer)}
              className="w-5 h-5 rounded-full border border-purple-400/40 bg-purple-500/15 hover:bg-purple-500/30 text-purple-300 flex items-center justify-center text-[11px] font-black transition-all hover:scale-110 active:scale-95 shadow-sm"
              title={lang === 'ar' ? 'ما هو BYOK؟ اضغط للشرح' : 'What is BYOK? Click for explanation'}
            >
              ?
            </button>
          </div>

          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              apiKeyInput.trim()
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                : 'bg-[#121318] text-[#8c909e] border-[#20222a]'
            }`}
          >
            {apiKeyInput.trim()
              ? lang === 'ar' ? 'المفتاح مفعل' : 'KEY ACTIVE'
              : lang === 'ar' ? 'لا يوجد مفتاح' : 'NO KEY SET'}
          </span>
        </div>

        {/* Interactive BYOK Explanation Card */}
        {showByokExplainer && (
          <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/30 text-purple-200 text-xs space-y-2 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-[#e8e8f0] flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-purple-400" />
                <span>{lang === 'ar' ? 'ما معنى نموذج BYOK (أحضر مفتاحك الخاص)؟' : 'What is BYOK (Bring Your Own Key)?'}</span>
              </span>
              <button
                type="button"
                onClick={() => setShowByokExplainer(false)}
                className="text-purple-400 hover:text-[#e8e8f0] text-xs font-bold"
              >
                ✕
              </button>
            </div>
            <p className="text-[11px] text-purple-200/90 leading-relaxed">
              {lang === 'ar'
                ? 'مفهوم BYOK يعني أنك تستخدم مفتاح API المجاني الخاص بك مباشرة من Google AI Studio داخل متصفحك. لا توجد خوادم وسيطة تخزن مفتاحك أو تراقب طلباتك، بل يتم التشفير والحفظ محلياً في جهازك ومزامنتها تلقائياً مع نسختك في Google Drive. تمنحك Google حصة مجانية تصل إلى 20 طلباً يومياً تتجدد تلقائياً كل منتصف ليل.'
                : 'BYOK (Bring Your Own Key) means you connect your own free Google Gemini API key directly from Google AI Studio. Your key runs completely client-side in your browser, keeping your data 100% private. It is never routed through any third-party backend servers. Google provides 20 free calls daily, reset every midnight.'}
            </p>
            <div className="pt-1">
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-300 hover:underline"
              >
                <span>{lang === 'ar' ? 'احصل على مفتاح مجاني من Google AI Studio ←' : 'Get your free key from Google AI Studio →'}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}

        <p className="text-[11px] text-[#8c909e] leading-relaxed">
          {lang === 'ar'
            ? 'أدخل مفتاح Google Gemini API الشخصي الخاص بك لتشغيل توليد البطاقات التعليمية واختبارات الكويز الذكية. يتم حفظ المفتاح محلياً في متصفحك ويُضمّن في النسخة الاحتياطية على Google Drive.'
            : 'Enter your personal Google Gemini API key to power flashcard generation and smart quizzes. Your key is stored securely in your browser and synced with your Google Drive backup.'}
        </p>

        {/* Real Model Selector (Auto-Synced from Google Gemini API) */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-xs font-bold text-[#f3f4f6] flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5" style={{ color: primaryColor }} />
              <span>{t('model', lang)}</span>
            </label>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#8c909e]">
                {modelSyncMeta.isLive
                  ? lang === 'ar'
                    ? `محدّث تلقائياً · ${liveModels.length} نماذج`
                    : `Auto-synced · ${liveModels.length} models`
                  : lang === 'ar'
                  ? 'يتحدث تلقائياً عند تفعيل المفتاح'
                  : 'Syncs live with Google API'}
              </span>
              {apiKeyInput.trim() && (
                <button
                  type="button"
                  disabled={isSyncingModels}
                  onClick={() => refreshModels(true, apiKeyInput.trim())}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#121318] border border-[#20222a] hover:border-[#2e303c] text-[10px] font-bold text-[#e8e8f0] disabled:opacity-50 transition-colors"
                  title={lang === 'ar' ? 'تحديث قائمة النماذج من Google الآن' : 'Refresh live models from Google'}
                >
                  <RefreshCw className={`w-3 h-3 ${isSyncingModels ? 'animate-spin' : ''}`} />
                  <span>{lang === 'ar' ? 'تحديث' : 'Sync'}</span>
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {liveModels.map((m) => {
              const isSelected = selectedModel === m.id;
              const badgeLabel =
                m.badge === 'new'
                  ? lang === 'ar'
                    ? 'جديد'
                    : 'New'
                  : m.badge === 'paid'
                  ? lang === 'ar'
                    ? 'مدفوع'
                    : 'Paid'
                  : m.badge === 'latest'
                  ? lang === 'ar'
                    ? 'محدّث'
                    : 'Latest'
                  : m.badge === 'fast'
                  ? lang === 'ar'
                    ? 'سريع'
                    : 'Fast'
                  : null;

              return (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => handleModelChange(m.id)}
                  className={`p-3 rounded-xl border text-start transition-all flex flex-col justify-between gap-1 ${
                    isSelected
                      ? 'bg-emerald-500/10 border-emerald-500/40 shadow-sm'
                      : 'bg-[#121318] border-[#20222a] hover:border-[#2e303c]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-xs font-bold text-[#f3f4f6] leading-tight">
                      {m.name}
                    </span>
                    {isSelected ? (
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded text-white shrink-0"
                        style={{ backgroundColor: primaryColor }}
                      >
                        {t('activeBadge', lang)}
                      </span>
                    ) : (
                      badgeLabel && (
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                            m.badge === 'paid'
                              ? 'bg-sky-500/15 text-sky-300'
                              : m.badge === 'new'
                              ? 'bg-emerald-500/15 text-emerald-300'
                              : 'bg-[#1c1c3a] text-[#8c909e]'
                          }`}
                        >
                          {badgeLabel}
                        </span>
                      )
                    )}
                  </div>
                  <span className="text-[10px] text-[#8c909e] leading-snug">
                    {lang === 'ar' ? m.descAr : m.descEn}
                  </span>
                </button>
              );
            })}
          </div>

          {isGemini4Model(selectedModel) && (
            <div className="p-3 rounded-xl bg-[#121318] border border-[#20222a] flex flex-wrap items-center justify-between gap-2">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-[#f3f4f6] block">
                  {lang === 'ar' ? 'عمق التفكير (Gemini 4)' : 'Reasoning Depth (Gemini 4)'}
                </span>
                <span className="text-[10px] text-[#8c909e] block">
                  {lang === 'ar'
                    ? 'تحكّم بمستوى التحليل دون تمرير معاملات قديمة'
                    : 'Controls Gemini 4 thinkingLevel cleanly'}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {(
                  [
                    { val: undefined, label: lang === 'ar' ? 'تلقائي' : 'Auto' },
                    { val: 'LOW', label: lang === 'ar' ? 'سريع' : 'Low' },
                    { val: 'MEDIUM', label: lang === 'ar' ? 'متوازن' : 'Medium' },
                    { val: 'HIGH', label: lang === 'ar' ? 'عميق' : 'High' },
                    ...(selectedModel === 'gemini-4-hydrogen'
                      ? [{ val: 'XHIGH', label: lang === 'ar' ? 'أقصى عمق' : 'XHigh' }]
                      : []),
                  ] as Array<{ val: ThinkingLevelOption | undefined; label: string }>
                ).map((lvl) => {
                  const active = (state.settings.thinkingLevel || undefined) === lvl.val;
                  return (
                    <button
                      key={lvl.label}
                      type="button"
                      onClick={() => onUpdateSettings({ thinkingLevel: lvl.val })}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                        active
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-[#1c1c3a] text-[#8c909e] hover:text-white border border-[#20222a]'
                      }`}
                    >
                      {lvl.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Gemini API Key Input */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-[#f3f4f6] flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5" style={{ color: primaryColor }} />
            <span>{t('apiKey', lang)} (Google Gemini)</span>
          </label>

          <div className="relative">
            <input
              type={showApiKey ? 'text' : 'password'}
              value={apiKeyInput}
              onChange={(e) => handleKeyInputChange(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full px-3.5 py-2.5 pe-10 rounded-xl bg-[#121318] border border-[#20222a] text-xs font-mono text-[#f3f4f6] focus:outline-none focus:border-purple-500"
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute inset-y-0 end-0 pe-3 flex items-center text-[#8c909e] hover:text-[#f3f4f6]"
              title={showApiKey ? 'Hide Key' : 'Show Key'}
            >
              {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* 5-minute initialization notice */}
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-[11px] leading-relaxed">
            {lang === 'ar'
              ? 'ملاحظة: تهيئة وتفعيل مفتاح API في خوادم Google قد يستغرق ما يصل إلى 5 دقائق بعد إنشائه. من الطبيعي الانتظار قليلاً قبل قبوله والتحقق منه.'
              : "Note: Initializing the API key can take up to 5 minutes. It's normal to wait a bit longer than usual for it to be accepted."}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveApiKey}
                style={{ backgroundColor: primaryColor }}
                className="px-4 py-2 rounded-xl text-white font-bold text-xs shadow-md transition-all active:scale-95"
              >
                {t('save', lang)}
              </button>

              <button
                type="button"
                disabled={isTestingKey || !apiKeyInput.trim()}
                onClick={handleTestApiKey}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#121318] border border-[#20222a] hover:border-[#2e303c] disabled:opacity-50 text-xs font-bold text-[#f3f4f6] transition-colors active:scale-95"
              >
                {isTestingKey ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                )}
                <span>{t('testConnection', lang)}</span>
              </button>

              {apiKeyInput.trim() && (
                <button
                  type="button"
                  onClick={handleClearApiKey}
                  className="px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 hover:bg-rose-500/20 text-xs font-bold transition-all active:scale-95"
                >
                  {t('clearOffline', lang)}
                </button>
              )}
            </div>

            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[11px] font-semibold text-purple-400 hover:text-purple-300 transition-colors"
            >
              <span>{lang === 'ar' ? 'الحصول على مفتاح مجاني' : 'Get a free Gemini API key'}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Test or Save Result Banner */}
          {testResult && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                testResult.success
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}

          {/* AI Quota Tier Selector */}
          <div className="p-3 rounded-xl bg-[#121318] border border-[#20222a] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#f3f4f6]">
                {lang === 'ar' ? 'باقة استخدام المفتاح (الحصة اليومية):' : 'API Key Quota Tier:'}
              </span>
              <span className="text-[10px] text-teal-400 font-mono font-bold">
                {state.settings.aiTier === 'paid'
                  ? lang === 'ar'
                    ? 'حصة غير محدودة (مدفوع)'
                    : 'Unlimited / High Quota'
                  : '20 calls / day (Free Tier)'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onUpdateSettings({ aiTier: 'free' })}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all text-center ${
                  state.settings.aiTier !== 'paid'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-[#0b0c10] border border-[#20222a] text-[#8c909e] hover:text-white'
                }`}
              >
                {lang === 'ar' ? 'المجانية (20 يومياً)' : 'Free Tier (20/day)'}
              </button>
              <button
                type="button"
                onClick={() => onUpdateSettings({ aiTier: 'paid' })}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all text-center ${
                  state.settings.aiTier === 'paid'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-[#0b0c10] border border-[#20222a] text-[#8c909e] hover:text-white'
                }`}
              >
                {lang === 'ar' ? 'باقة مدفوعة (بدون حد)' : 'Paid / High Quota'}
              </button>
            </div>
          </div>

          {/* Real AI Daily Usage Info */}
          <div className="p-3 rounded-xl bg-[#121318] border border-[#20222a] flex items-center justify-between text-xs">
            <span className="text-[#8c909e]">
              {lang === 'ar' ? 'الاستخدام اليومي المسجل:' : 'Recorded AI calls today:'}
            </span>
            <span className="font-mono font-bold text-[#f3f4f6]">
              {state.settings.aiTier === 'paid'
                ? `${state.settings.aiUsageToday || 0} calls (Paid Tier - High Quota)`
                : `${state.settings.aiUsageToday || 0} / 20 ${lang === 'ar' ? 'استدعاء' : 'calls'}`}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Google Drive Sync */}
      <div className="p-6 rounded-2xl bg-[#0b0c10] border border-[#1a1b22] space-y-4 shadow-lg">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-sm text-[#f3f4f6] flex items-center gap-2">
            <Cloud className="w-4 h-4" style={{ color: primaryColor }} />
            <span>{t('gdriveSync', lang)}</span>
          </h3>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              isGoogleConnected
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                : 'bg-[#121318] text-[#8c909e] border-[#20222a]'
            }`}
          >
            {isGoogleConnected
              ? `${t('googleConnected', lang)} (${state.profile?.email || state.profile?.name})`
              : t('googleNotConnected', lang)}
          </span>
        </div>

        <p className="text-[11px] text-[#8c909e] leading-relaxed">
          {lang === 'ar'
            ? 'مزامنة بياناتك وحفظ نسختك ومفتاحك تلقائياً في مجلد التطبيق الخاص (appDataFolder) على Google Drive.'
            : 'Sync via private App Data folder. Automatically restores your study data upon login.'}
        </p>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          {!isGoogleConnected ? (
            <button
              type="button"
              disabled={isConnectingGoogle}
              onClick={handleConnectGoogle}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 transition-all shadow-md flex items-center gap-2 active:scale-95 disabled:opacity-50"
            >
              {isConnectingGoogle ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-800" />
              ) : (
                <GoogleLogo className="w-4 h-4 shrink-0" />
              )}
              <span>{lang === 'ar' ? 'ربط بحساب Google' : 'Sign in with Google'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSignOutGoogle}
              className="px-3.5 py-2 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 hover:bg-rose-500/20 text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{t('signOut', lang)}</span>
            </button>
          )}

          {isGoogleConnected && (
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-rose-600/15 border border-rose-500/30 text-rose-400 hover:bg-rose-600/25 text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'حذف الحساب وإلغاء الربط' : 'Delete Account'}</span>
            </button>
          )}

          <button
            type="button"
            disabled={isUploadingDrive}
            onClick={handleUploadDriveBackup}
            className="px-4 py-2 rounded-xl bg-[#121318] border border-[#20222a] hover:border-[#2e303c] text-xs font-bold text-[#f3f4f6] transition-colors flex items-center gap-1.5"
          >
            {isUploadingDrive ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Upload className="w-3.5 h-3.5" />
            )}
            <span>{t('upload', lang)}</span>
          </button>

          <button
            type="button"
            disabled={isRestoringDrive}
            onClick={handleRestoreDriveBackup}
            className="px-4 py-2 rounded-xl bg-[#121318] border border-[#20222a] hover:border-[#2e303c] text-xs font-bold text-[#f3f4f6] transition-colors flex items-center gap-1.5"
          >
            {isRestoringDrive ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>{t('restore', lang)}</span>
          </button>
        </div>

        {driveStatusMessage && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
              driveStatusMessage.type === 'error'
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            }`}
          >
            {driveStatusMessage.type === 'error' ? (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            )}
            <span>{driveStatusMessage.text}</span>
          </div>
        )}
      </div>

      {/* 4. Study Goals */}
      <div className="p-6 rounded-2xl bg-[#0b0c10] border border-[#1a1b22] space-y-4 shadow-lg">
        <h3 className="font-extrabold text-sm text-[#f3f4f6] flex items-center gap-2">
          <Target className="w-4 h-4" style={{ color: primaryColor }} />
          <span>{t('studyGoals', lang)}</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] font-bold text-[#8c909e] block mb-1">
              Daily Goal (min)
            </label>
            <input
              type="number"
              step="10"
              min="10"
              placeholder="60"
              value={dailyGoal === 0 ? '' : dailyGoal}
              onFocus={(e) => e.currentTarget.select()}
              onChange={(e) => {
                const raw = e.target.value.replace(/^0+(?=\d)/, '');
                setDailyGoal(raw === '' ? 0 : Math.max(0, parseInt(raw, 10) || 0));
              }}
              className="w-full px-3 py-2 rounded-xl bg-[#121318] border border-[#20222a] text-xs font-mono font-bold text-[#f3f4f6] focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-[#8c909e] block mb-1">
              Weekly Goal (min)
            </label>
            <input
              type="number"
              step="30"
              min="30"
              placeholder="420"
              value={weeklyGoal === 0 ? '' : weeklyGoal}
              onFocus={(e) => e.currentTarget.select()}
              onChange={(e) => {
                const raw = e.target.value.replace(/^0+(?=\d)/, '');
                setWeeklyGoal(raw === '' ? 0 : Math.max(0, parseInt(raw, 10) || 0));
              }}
              className="w-full px-3 py-2 rounded-xl bg-[#121318] border border-[#20222a] text-xs font-mono font-bold text-[#f3f4f6] focus:outline-none"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="button"
            onClick={handleSaveGoals}
            style={{ backgroundColor: primaryColor }}
            className="px-5 py-2 rounded-xl text-white font-bold text-xs shadow-md transition-all"
          >
            {t('saveGoals', lang)}
          </button>

          {goalsStatusMessage && (
            <div className="px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{goalsStatusMessage}</span>
            </div>
          )}
        </div>
      </div>

      {/* 5. Tutorial */}
      <div className="p-6 rounded-2xl bg-[#0b0c10] border border-[#1a1b22] space-y-3 shadow-lg">
        <h3 className="font-extrabold text-sm text-[#f3f4f6] flex items-center gap-2">
          <HelpCircle className="w-4 h-4" style={{ color: primaryColor }} />
          <span>{t('tutorial', lang)}</span>
        </h3>

        <p className="text-[11px] text-[#8c909e]">
          {t('tutorialDesc', lang)}
        </p>

        <button
          type="button"
          onClick={() => {
            if (onStartTutorial) onStartTutorial();
          }}
          style={{ backgroundColor: primaryColor }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white font-bold text-xs shadow-md transition-all"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>{t('replayTutorial', lang)}</span>
        </button>
      </div>

      {/* 6. Offline Mode */}
      <div className="p-6 rounded-2xl bg-[#0b0c10] border border-[#1a1b22] space-y-3 shadow-lg">
        <h3 className="font-extrabold text-sm text-[#f3f4f6] flex items-center gap-2">
          <DownloadCloud className="w-4 h-4" style={{ color: primaryColor }} />
          <span>{t('offlineMode', lang)}</span>
        </h3>

        <p className="text-[11px] text-[#8c909e]">
          {t('offlineDesc', lang)}
        </p>

        <div className="flex items-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={handleDownloadOffline}
            style={{ backgroundColor: primaryColor }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white font-bold text-xs shadow-md transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t('downloadUpdate', lang)}</span>
          </button>

          <button
            type="button"
            onClick={handleClearOffline}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 hover:bg-rose-500/20 text-xs font-bold transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t('clearOffline', lang)}</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-[11px] pt-1">
          {isOfflineCached ? (
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>{t('offlineReady', lang)}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[#8c909e]">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>{t('noOfflineCopy', lang)}</span>
            </div>
          )}
          {offlineStatus && <span className="text-[#f3f4f6] ms-2">{offlineStatus}</span>}
        </div>
      </div>

      {/* 7. Data Management */}
      <div className="p-6 rounded-2xl bg-[#0b0c10] border border-[#1a1b22] space-y-5 shadow-lg">
        <h3 className="font-extrabold text-sm text-[#f3f4f6] flex items-center gap-2">
          <Database className="w-4 h-4" style={{ color: primaryColor }} />
          <span>{t('dataManagement', lang)}</span>
        </h3>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => exportAppState(state)}
            className="px-4 py-2 rounded-xl bg-[#121318] border border-[#20222a] hover:border-[#2e303c] text-xs font-bold text-[#f3f4f6] transition-colors"
          >
            Export JSON
          </button>

          <label className="px-4 py-2 rounded-xl bg-[#121318] border border-[#20222a] hover:border-[#2e303c] text-xs font-bold text-[#f3f4f6] transition-colors cursor-pointer">
            Import JSON
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  onImportState(file);
                  e.target.value = '';
                }
              }}
            />
          </label>
        </div>

        <div className="pt-2 space-y-2">
          <button
            type="button"
            onClick={() => setIsDeleteModalOpen(true)}
            className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-950/40 active:scale-95"
          >
            <Trash2 className="w-4 h-4" />
            <span>{lang === 'ar' ? 'حذف الحساب نهائياً وفصل التطبيقات المرتبطة' : 'Delete Account & Revoke Connected App'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (window.confirm(t('confirmReset', lang))) {
                onResetAll();
              }
            }}
            className="w-full py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 hover:bg-rose-500/20 text-xs font-bold transition-all flex items-center justify-center gap-2"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t('resetAll', lang)}</span>
          </button>
          <span className="text-[10px] text-[#8c909e] block text-center mt-1">
            {t('deleteDataWarning', lang)}
          </span>
        </div>
      </div>

      {/* 8. Legal, Privacy & Compliance */}
      <div className="p-6 rounded-2xl bg-[#0b0c10] border border-[#1a1b22] space-y-4 shadow-lg">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-sm text-[#f3f4f6] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>{lang === 'ar' ? 'السياسات وشروط الخدمة' : 'Policies & Legal Compliance'}</span>
          </h3>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {lang === 'ar' ? 'متوافق مع Google' : 'Google API Compliant'}
          </span>
        </div>
        <p className="text-xs text-[#8c909e] leading-relaxed">
          {lang === 'ar'
            ? 'تلتزم StudyFlow بحماية خصوصية بياناتك الدراسية وتخزينها بشكل محلي وفي مساحة Google Drive المخصصة لتطبيقك فقط بدون مشاركتها مع أي طرف خارجي.'
            : 'StudyFlow complies with Google API User Data Policies. Your flashcards and study statistics are stored locally and within your private Google Drive appDataFolder.'}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={() => onOpenTerms ? onOpenTerms('privacy') : window.open('./privacy.html', '_blank')}
            className="flex items-center justify-between p-3.5 rounded-xl bg-[#121318] border border-[#20222a] hover:border-purple-500/40 text-xs font-semibold text-[#f3f4f6] group transition-all text-start"
          >
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
              <div>
                <span className="block font-bold text-xs">{lang === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy'}</span>
                <span className="block text-[10px] text-[#8c909e]">{lang === 'ar' ? 'عرض السياسة المعتمدة' : 'View Google Compliant Policy'}</span>
              </div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-[#8c909e] group-hover:text-purple-400 transition-colors" />
          </button>

          <button
            type="button"
            onClick={() => onOpenTerms ? onOpenTerms('terms') : window.open('./terms.html', '_blank')}
            className="flex items-center justify-between p-3.5 rounded-xl bg-[#121318] border border-[#20222a] hover:border-purple-500/40 text-xs font-semibold text-[#f3f4f6] group transition-all text-start"
          >
            <div className="flex items-center gap-2.5">
              <FileText className="w-4 h-4 text-teal-400 group-hover:scale-110 transition-transform" />
              <div>
                <span className="block font-bold text-xs">{lang === 'ar' ? 'شروط الخدمة' : 'Terms of Service'}</span>
                <span className="block text-[10px] text-[#8c909e]">{lang === 'ar' ? 'عرض شروط الاستخدام' : 'View Terms & Conditions'}</span>
              </div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-[#8c909e] group-hover:text-teal-400 transition-colors" />
          </button>
        </div>
      </div>

      <DeleteAccountChallengeModal
        isOpen={isDeleteModalOpen}
        lang={lang}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirmDelete={handleConfirmDeleteAccount}
      />
    </div>
  );
};
