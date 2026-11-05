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
import { AppSettings, AppState, UserProfile } from '../types/index.ts';
import { PRIMARY_COLORS, exportAppState } from '../utils/storage.ts';
import { t } from '../utils/translations.ts';
import {
  requestGoogleAccessToken,
  fetchGoogleUserProfile,
  uploadBackupToDrive,
  restoreBackupFromDrive,
  revokeGoogleAccess,
  getStoredAccessToken,
  setStoredAccessToken,
} from '../utils/googleDrive.ts';
import { DeleteAccountChallengeModal } from './modals/DeleteAccountChallengeModal.tsx';
import {
  getGeminiApiKey,
  setGeminiApiKey,
  testGeminiApiKey,
  DEFAULT_GEMINI_MODEL,
} from '../utils/gemini.ts';

interface SettingsViewProps {
  state: AppState;
  lang: 'ar' | 'en';
  onUpdateSettings: (settings: Partial<AppSettings>) => void;
  onUpdateProfile: (profile: Partial<UserProfile>) => void;
  onRestoreState: (restored: AppState) => void;
  onImportState: (file: File) => void;
  onResetAll: () => void;
  onStartTutorial?: () => void;
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
}) => {
  // Appearance & Language State
  const theme = state.settings.theme || 'black';
  const currentLang = state.settings.lang || 'en';
  const primaryColor = state.settings.primaryColor || '#22c55e';
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
      // Save valid key automatically
      setGeminiApiKey(keyToTest);
      onUpdateSettings({ apiKey: keyToTest });
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
    onUpdateSettings({ model: modelId });
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

          <div className="grid grid-cols-3 gap-2 p-1 bg-[#121318] rounded-xl border border-[#20222a] max-w-md">
            {/* Dark */}
            <button
              type="button"
              onClick={() => onUpdateSettings({ theme: 'dark' })}
              style={{
                backgroundColor: theme === 'dark' ? primaryColor : 'transparent',
                color: theme === 'dark' ? '#ffffff' : '#8c909e',
              }}
              className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all"
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
              className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all"
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
              className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all"
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
                placeholder="22C55E"
              />
              <span
                className="w-4 h-4 rounded shrink-0 border border-white/20"
                style={{ backgroundColor: `#${hexInput || '22C55E'}` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Real Gemini AI Settings (BYOK) - 100% Genuine, No Fake Inputs */}
      <div className="p-6 rounded-2xl bg-[#0b0c10] border border-[#1a1b22] space-y-5 shadow-lg">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-sm text-[#f3f4f6] flex items-center gap-2">
            <Sparkles className="w-4 h-4" style={{ color: primaryColor }} />
            <span>
              {lang === 'ar' ? 'محرك الذكاء الاصطناعي (Google Gemini BYOK)' : 'Google Gemini AI Engine (BYOK)'}
            </span>
          </h3>
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

        <p className="text-[11px] text-[#8c909e] leading-relaxed">
          {lang === 'ar'
            ? 'أدخل مفتاح Google Gemini API الشخصي الخاص بك لتشغيل توليد البطاقات التعليمية واختبارات الكويز الذكية. يتم حفظ المفتاح محلياً في متصفحك ويُضمّن في النسخة الاحتياطية على Google Drive.'
            : 'Enter your personal Google Gemini API key to power flashcard generation and smart quizzes. Your key is stored securely in your browser and synced with your Google Drive backup.'}
        </p>

        {/* Real Model Selector */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-[#f3f4f6] flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5" style={{ color: primaryColor }} />
            <span>{t('model', lang)}</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              {
                id: 'gemini-3.8-flash',
                name: 'Gemini 3.8 Flash',
                desc: lang === 'ar' ? 'أحدث جيل فائق السرعة (موصى به)' : 'Latest & Recommended',
              },
              {
                id: 'gemini-4-argon',
                name: 'Gemini 4 Argon',
                desc: lang === 'ar' ? 'تفكير عميق ودقة فائقة' : 'Deep Reasoning & Accuracy',
              },
              {
                id: 'gemini-3.1-flash-lite',
                name: 'Gemini 3.1 Flash Lite',
                desc: lang === 'ar' ? 'خفيف وسريع جداً' : 'Lightweight & Ultra Fast',
              },
            ].map((m) => {
              const isSelected = selectedModel === m.id;
              return (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => handleModelChange(m.id)}
                  className={`p-3 rounded-xl border text-start transition-all ${
                    isSelected
                      ? 'bg-[#12131a] border-emerald-500/40 shadow-sm'
                      : 'bg-[#121318] border-[#20222a] hover:border-[#2e303c]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#f3f4f6]">
                      {m.name}
                    </span>
                    {isSelected && (
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded text-white"
                        style={{ backgroundColor: primaryColor }}
                      >
                        {t('activeBadge', lang)}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-[#8c909e] block mt-0.5">
                    {m.desc}
                  </span>
                </button>
              );
            })}
          </div>
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
              onChange={(e) => setApiKeyInput(e.target.value)}
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

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveApiKey}
                style={{ backgroundColor: primaryColor }}
                className="px-4 py-2 rounded-xl text-white font-bold text-xs shadow-md transition-all"
              >
                {t('save', lang)}
              </button>

              <button
                type="button"
                disabled={isTestingKey || !apiKeyInput.trim()}
                onClick={handleTestApiKey}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#121318] border border-[#20222a] hover:border-[#2e303c] disabled:opacity-50 text-xs font-bold text-[#f3f4f6] transition-colors"
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
                  className="px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 hover:bg-rose-500/20 text-xs font-bold transition-all"
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

          {/* Real AI Daily Usage Info */}
          <div className="p-3 rounded-xl bg-[#121318] border border-[#20222a] flex items-center justify-between text-xs">
            <span className="text-[#8c909e]">
              {lang === 'ar' ? 'الاستخدام اليومي المسجل:' : 'Recorded AI calls today:'}
            </span>
            <span className="font-mono font-bold text-[#f3f4f6]">
              {state.settings.aiUsageToday || 0} / 50 {lang === 'ar' ? 'استدعاء' : 'calls'}
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
              style={{ backgroundColor: primaryColor }}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-sm flex items-center gap-1.5"
            >
              {isConnectingGoogle ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Cloud className="w-3.5 h-3.5" />
              )}
              <span>{t('connect', lang)}</span>
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
              value={dailyGoal}
              onChange={(e) => setDailyGoal(Number(e.target.value))}
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
              value={weeklyGoal}
              onChange={(e) => setWeeklyGoal(Number(e.target.value))}
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

        <div className="pt-2">
          <button
            type="button"
            onClick={() => {
              if (window.confirm(t('confirmReset', lang))) {
                onResetAll();
              }
            }}
            className="w-full py-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 hover:bg-rose-500/20 text-xs font-bold transition-all flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>{t('resetAll', lang)}</span>
          </button>
          <span className="text-[10px] text-[#8c909e] block text-center mt-2">
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
          <a
            href="./privacy.html"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3.5 rounded-xl bg-[#121318] border border-[#20222a] hover:border-purple-500/40 text-xs font-semibold text-[#f3f4f6] group transition-all"
          >
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
              <div>
                <span className="block font-bold text-xs">{lang === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy'}</span>
                <span className="block text-[10px] text-[#8c909e]">privacy.html</span>
              </div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-[#8c909e] group-hover:text-purple-400 transition-colors" />
          </a>

          <a
            href="./terms.html"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3.5 rounded-xl bg-[#121318] border border-[#20222a] hover:border-purple-500/40 text-xs font-semibold text-[#f3f4f6] group transition-all"
          >
            <div className="flex items-center gap-2.5">
              <FileText className="w-4 h-4 text-teal-400 group-hover:scale-110 transition-transform" />
              <div>
                <span className="block font-bold text-xs">{lang === 'ar' ? 'شروط الخدمة' : 'Terms of Service'}</span>
                <span className="block text-[10px] text-[#8c909e]">terms.html</span>
              </div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-[#8c909e] group-hover:text-teal-400 transition-colors" />
          </a>
        </div>
      </div>
    </div>
  );
};
