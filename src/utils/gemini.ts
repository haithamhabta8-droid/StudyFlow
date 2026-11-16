import { ThinkingLevelOption } from '../types/index.ts';

/**
 * Bring Your Own Key (BYOK) Gemini API Integration
 * Key is stored securely in localStorage ('gemini_api_key')
 */

export const GEMINI_API_KEY_STORAGE = 'gemini_api_key';
export const GEMINI_LIVE_CATALOG_STORAGE = 'studyflow_live_gemini_models_v1';
export const GEMINI_MODELS_UPDATED_EVENT = 'studyflow-models-updated';
export const DEFAULT_GEMINI_MODEL = 'gemini-4-hydrogen';

export interface AIModelDefinition {
  id: string;
  name: string;
  badge?: 'new' | 'paid' | 'latest' | 'fast';
  tier: 'free' | 'paid';
  series: 'gemini-5' | 'gemini-4' | 'gemini-3' | 'alias';
  supportsXHigh?: boolean;
  descEn: string;
  descAr: string;
  source?: 'baseline' | 'live';
  apiVersion?: string;
}

export interface GoogleApiModelRecord {
  name: string;
  baseModelId?: string;
  version?: string;
  displayName?: string;
  description?: string;
  supportedGenerationMethods?: string[];
}

export interface LiveCatalogMeta {
  syncedAt: number | null;
  isLive: boolean;
  addedIds: string[];
  removedIds: string[];
}

interface StoredLiveCatalog {
  syncedAt: number;
  models: AIModelDefinition[];
  knownFirstSeen: Record<string, number>;
  addedIds: string[];
  removedIds: string[];
  keyFingerprint?: string;
}

export const AI_MODEL_CATALOG: AIModelDefinition[] = [
  {
    id: 'gemini-4-hydrogen',
    name: 'Gemini 4 Hydrogen',
    badge: 'new',
    tier: 'free',
    series: 'gemini-4',
    supportsXHigh: true,
    descEn: 'Default · Balanced next-gen speed & intelligence',
    descAr: 'جديد · الافتراضي المتوازن بين الذكاء والسرعة',
  },
  {
    id: 'gemini-4-carbon',
    name: 'Gemini 4 Carbon',
    badge: 'paid',
    tier: 'paid',
    series: 'gemini-4',
    descEn: 'Paid · Deepest reasoning & complex problem solving',
    descAr: 'مدفوع · أعمق تحليل وحل المسائل المعقدة',
  },
  {
    id: 'gemini-4-argon',
    name: 'Gemini 4 Argon',
    badge: 'paid',
    tier: 'paid',
    series: 'gemini-4',
    descEn: 'Paid · High-accuracy STEM, math & structured study',
    descAr: 'مدفوع · دقة عالية للعلوم والرياضيات والتلخيص',
  },
  {
    id: 'gemini-3.5-flash-lite',
    name: 'Gemini 3.5 Flash Lite',
    badge: 'fast',
    tier: 'free',
    series: 'gemini-3',
    descEn: 'Fast & efficient for cards and quick drills',
    descAr: 'سريع وفعّال لتوليد البطاقات والمراجعة السريعة',
  },
  {
    id: 'gemini-flash-latest',
    name: 'Gemini Flash Latest',
    badge: 'latest',
    tier: 'free',
    series: 'alias',
    descEn: 'Auto-updated alias tracking latest Flash',
    descAr: 'يتحدث تلقائياً لأحدث إصدار من Flash',
  },
  {
    id: 'gemini-flash-lite-latest',
    name: 'Gemini Flash-Lite Latest',
    badge: 'latest',
    tier: 'free',
    series: 'alias',
    descEn: 'Auto-updated alias tracking latest Flash-Lite',
    descAr: 'يتحدث تلقائياً لأحدث إصدار من Flash-Lite',
  },
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    tier: 'free',
    series: 'gemini-3',
    descEn: 'High-speed generation & tutoring model',
    descAr: 'نموذج سريع لتوليد المحتوى والشرح الدراسي',
  },
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash Lite',
    badge: 'fast',
    tier: 'free',
    series: 'gemini-3',
    descEn: 'Lightweight & ultra-low latency',
    descAr: 'خفيف جداً وفائق السرعة',
  },
];

const BASELINE_IDS = new Set(AI_MODEL_CATALOG.map((m) => m.id));
const BASELINE_MAX_VERSION = 4.0;
const NEW_DISCOVERY_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

function parseGeminiVersionScore(id: string): number {
  const match = id.match(/gemini-(\d+(?:\.\d+)?)/i);
  return match ? parseFloat(match[1]) : 0;
}

function formatModelDisplayName(id: string, displayName?: string): string {
  const cleanDisplay = (displayName || '').replace(/^models\//i, '').trim();
  if (cleanDisplay && cleanDisplay.toLowerCase() !== id.toLowerCase()) {
    return cleanDisplay;
  }
  return id
    .split('-')
    .map((part) => {
      if (/^\d+(\.\d+)?$/.test(part)) return part;
      if (part.toLowerCase() === 'lite') return 'Lite';
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join(' ');
}

function isSupportedTextGenerationModel(record: GoogleApiModelRecord): boolean {
  const id = (record.name || '').replace(/^models\//i, '').trim().toLowerCase();
  if (!id || !id.includes('gemini')) return false;

  if (
    Array.isArray(record.supportedGenerationMethods) &&
    !record.supportedGenerationMethods.includes('generateContent')
  ) {
    return false;
  }

  // Exclude specialized non-study endpoints (embeddings, image/video gen, TTS, robotics, audio)
  if (
    /(embedding|aqa|imagen|veo|tts|audio|native-audio|robotics|computer-use|customtools|bisect|live|learnlm|nano-banana|exp-image|image-preview|vision-only)/i.test(
      id
    )
  ) {
    return false;
  }

  // Exclude retired legacy series (1.0, 1.5, 2.0, 2.5, original gemini-pro)
  if (
    id === 'gemini-pro' ||
    id === 'gemini-pro-vision' ||
    /gemini-(1\.0|1\.5|2\.0|2\.5)\b/i.test(id)
  ) {
    return false;
  }

  const desc = `${record.displayName || ''} ${record.description || ''}`.toLowerCase();
  if (/\b(deprecated|discontinued|shut\s*down|retired|legacy\s+model)\b/i.test(desc)) {
    return false;
  }

  return true;
}

function readStoredLiveCatalog(): StoredLiveCatalog | null {
  try {
    const raw = localStorage.getItem(GEMINI_LIVE_CATALOG_STORAGE);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredLiveCatalog;
    if (!parsed || !Array.isArray(parsed.models) || parsed.models.length === 0) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function emitModelsUpdatedEvent(): void {
  try {
    if (typeof window !== 'undefined' && typeof CustomEvent !== 'undefined') {
      window.dispatchEvent(new CustomEvent(GEMINI_MODELS_UPDATED_EVENT));
    }
  } catch {}
}

export function clearLiveGeminiModelsCache(): void {
  try {
    localStorage.removeItem(GEMINI_LIVE_CATALOG_STORAGE);
  } catch {}
  emitModelsUpdatedEvent();
}

export function getEffectiveGeminiModels(): AIModelDefinition[] {
  const cached = readStoredLiveCatalog();
  if (cached && cached.models.length > 0) {
    return cached.models;
  }
  return AI_MODEL_CATALOG;
}

export function getGeminiCatalogMeta(): LiveCatalogMeta {
  const cached = readStoredLiveCatalog();
  if (!cached) {
    return {
      syncedAt: null,
      isLive: false,
      addedIds: [],
      removedIds: [],
    };
  }
  return {
    syncedAt: cached.syncedAt,
    isLive: true,
    addedIds: cached.addedIds || [],
    removedIds: cached.removedIds || [],
  };
}

/**
 * Merges live Google `/v1beta/models` records with baseline metadata.
 * - Newly released Google Gemini text models are automatically added with `badge: 'new'`.
 * - Retired/removed models are pruned from the active catalog.
 * - Dynamic badges (`new` / `latest` / `paid` / `fast`) update automatically when Google
 *   removes the newness signal from a model's metadata or ships a newer version family.
 */
export function mergeLiveGeminiModels(
  apiModels: GoogleApiModelRecord[],
  prevFirstSeen: Record<string, number> = {},
  nowMs: number = Date.now()
): {
  models: AIModelDefinition[];
  firstSeen: Record<string, number>;
  addedIds: string[];
  removedIds: string[];
} {
  const filteredRecords = apiModels.filter(isSupportedTextGenerationModel);
  if (filteredRecords.length === 0) {
    return {
      models: AI_MODEL_CATALOG,
      firstSeen: prevFirstSeen,
      addedIds: [],
      removedIds: [],
    };
  }

  const byId = new Map<string, GoogleApiModelRecord>();
  for (const rec of filteredRecords) {
    const id = rec.name.replace(/^models\//i, '').trim();
    if (!byId.has(id)) {
      byId.set(id, rec);
    }
  }

  const liveIds = Array.from(byId.keys());
  const nextFirstSeen: Record<string, number> = { ...prevFirstSeen };

  // Highest numerical Gemini version currently returned by Google (excluding rolling aliases)
  const highestLiveVersion = liveIds.reduce(
    (maxV, id) => Math.max(maxV, parseGeminiVersionScore(id)),
    0
  );
  const hasNewerNonBaselineModel = liveIds.some(
    (id) => !BASELINE_IDS.has(id) && !id.includes('latest')
  );

  const addedIds: string[] = [];
  const merged: AIModelDefinition[] = [];

  for (const [id, rec] of byId.entries()) {
    const baseline = AI_MODEL_CATALOG.find((m) => m.id === id);
    const versionScore = parseGeminiVersionScore(id);
    const isAlias = id.endsWith('-latest') || id.includes('flash-latest') || id.includes('flash-lite-latest');
    const combinedMetaText = `${rec.displayName || ''} ${rec.description || ''}`;
    const hasExplicitNewSignal = /\b(new|newest|preview|experimental|next-gen|next\s+generation)\b/i.test(
      combinedMetaText
    );
    const hasStableSupersededSignal = /\b(stable|general availability|ga)\b/i.test(combinedMetaText);

    if (!baseline) {
      addedIds.push(id);
      if (!nextFirstSeen[id]) {
        nextFirstSeen[id] = nowMs;
      }
      const firstSeenAge = nowMs - (nextFirstSeen[id] || nowMs);
      const isPaid = /\b(pro|ultra|carbon|argon|reasoning)\b/i.test(id) && !/\bflash\b/i.test(id);
      const isFlashLite = id.includes('flash-lite') || id.includes('lite');

      let badge: AIModelDefinition['badge'];
      if (isAlias) {
        badge = 'latest';
      } else if (
        firstSeenAge <= NEW_DISCOVERY_WINDOW_MS ||
        versionScore >= highestLiveVersion ||
        hasExplicitNewSignal
      ) {
        badge = 'new';
      } else if (isPaid) {
        badge = 'paid';
      } else if (isFlashLite) {
        badge = 'fast';
      }

      const cleanApiDesc = (rec.description || '').trim();
      merged.push({
        id,
        name: formatModelDisplayName(id, rec.displayName),
        badge,
        tier: isPaid ? 'paid' : 'free',
        series: isAlias
          ? 'alias'
          : versionScore >= 5
          ? 'gemini-5'
          : versionScore >= 4
          ? 'gemini-4'
          : 'gemini-3',
        supportsXHigh: versionScore >= 4 && !isFlashLite,
        descEn: cleanApiDesc
          ? cleanApiDesc.slice(0, 88) + (cleanApiDesc.length > 88 ? '…' : '')
          : isPaid
          ? 'Paid · Newly released high-capability model'
          : 'Newly added Google Gemini model',
        descAr: isPaid
          ? 'مدفوع · إصدار جديد عالي القدرة من Google'
          : 'إصدار حديث تمت إضافته تلقائياً من Google',
        source: 'live',
        apiVersion: rec.version,
      });
    } else {
      // Baseline catalog entry present in Google's live catalog:
      // Dynamically update its badge (e.g. remove 'new' when Google drops newness or ships newer versions)
      let dynamicBadge = baseline.badge;

      if (baseline.badge === 'new') {
        const isSupersededByNewerVersion =
          highestLiveVersion > BASELINE_MAX_VERSION ||
          (hasNewerNonBaselineModel && versionScore <= BASELINE_MAX_VERSION);
        const liveMetadataProvided = Boolean((rec.description || '').trim());
        const googleRemovedNewSignal =
          liveMetadataProvided && !hasExplicitNewSignal && (hasStableSupersededSignal || !baseline.descEn.includes(rec.description || '__none__'));

        if (isSupersededByNewerVersion || googleRemovedNewSignal) {
          dynamicBadge = baseline.tier === 'paid' ? 'paid' : undefined;
        }
      } else if (!dynamicBadge && hasExplicitNewSignal && versionScore >= highestLiveVersion) {
        dynamicBadge = 'new';
      }

      merged.push({
        ...baseline,
        name: formatModelDisplayName(id, rec.displayName || baseline.name),
        badge: dynamicBadge,
        descEn:
          dynamicBadge !== 'new' && baseline.id === 'gemini-4-hydrogen'
            ? 'Default · Balanced speed & intelligence'
            : baseline.descEn,
        descAr:
          dynamicBadge !== 'new' && baseline.id === 'gemini-4-hydrogen'
            ? 'الافتراضي المتوازن بين الذكاء والسرعة'
            : baseline.descAr,
        source: 'live',
        apiVersion: rec.version,
      });
    }
  }

  const removedIds = Array.from(BASELINE_IDS).filter((baseId) => !byId.has(baseId));

  // Order cleanly: New discoveries first, then baseline order, then remaining models by version desc
  const baselineIndexMap = new Map(AI_MODEL_CATALOG.map((m, idx) => [m.id, idx]));
  merged.sort((a, b) => {
    const aNewNonBase = !BASELINE_IDS.has(a.id) && a.badge === 'new' ? 0 : 1;
    const bNewNonBase = !BASELINE_IDS.has(b.id) && b.badge === 'new' ? 0 : 1;
    if (aNewNonBase !== bNewNonBase) return aNewNonBase - bNewNonBase;

    const aBaseIdx = baselineIndexMap.get(a.id);
    const bBaseIdx = baselineIndexMap.get(b.id);
    if (aBaseIdx !== undefined && bBaseIdx !== undefined) return aBaseIdx - bBaseIdx;
    if (aBaseIdx === undefined && bBaseIdx !== undefined) return -1;
    if (aBaseIdx !== undefined && bBaseIdx === undefined) return 1;

    return parseGeminiVersionScore(b.id) - parseGeminiVersionScore(a.id);
  });

  return {
    models: merged,
    firstSeen: nextFirstSeen,
    addedIds,
    removedIds,
  };
}

/**
 * Fetches live available models from Google Gemini API `/v1beta/models` and updates cache + listeners.
 */
export async function syncGeminiModels(
  providedKey?: string,
  options?: { force?: boolean }
): Promise<{ synced: boolean; models: AIModelDefinition[]; meta: LiveCatalogMeta; error?: string }> {
  const apiKey = (providedKey ?? getGeminiApiKey()).trim();
  if (!apiKey) {
    return {
      synced: false,
      models: getEffectiveGeminiModels(),
      meta: getGeminiCatalogMeta(),
      error: 'API key required to sync live Google models.',
    };
  }

  const prevCache = readStoredLiveCatalog();
  const keyFingerprint = apiKey.slice(-6);
  const SYNC_TTL_MS = 15 * 60 * 1000;
  if (
    !options?.force &&
    prevCache &&
    prevCache.keyFingerprint === keyFingerprint &&
    Date.now() - prevCache.syncedAt < SYNC_TTL_MS
  ) {
    return {
      synced: true,
      models: prevCache.models,
      meta: getGeminiCatalogMeta(),
    };
  }

  try {
    const collected: GoogleApiModelRecord[] = [];
    let pageToken: string | undefined;
    let guard = 0;

    do {
      guard += 1;
      const params = new URLSearchParams({
        pageSize: '100',
        key: apiKey,
      });
      if (pageToken) {
        params.set('pageToken', pageToken);
      }

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?${params.toString()}`
      );
      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
        const msg = errBody?.error?.message || `HTTP ${res.status}`;
        return {
          synced: false,
          models: getEffectiveGeminiModels(),
          meta: getGeminiCatalogMeta(),
          error: msg,
        };
      }

      const data = await res.json();
      if (Array.isArray(data?.models)) {
        collected.push(...data.models);
      }
      pageToken = data?.nextPageToken;
    } while (pageToken && guard < 5);

    const result = mergeLiveGeminiModels(collected, prevCache?.knownFirstSeen || {});
    if (collected.filter(isSupportedTextGenerationModel).length > 0) {
      const nextStored: StoredLiveCatalog = {
        syncedAt: Date.now(),
        models: result.models,
        knownFirstSeen: result.firstSeen,
        addedIds: result.addedIds,
        removedIds: result.removedIds,
        keyFingerprint,
      };
      try {
        localStorage.setItem(GEMINI_LIVE_CATALOG_STORAGE, JSON.stringify(nextStored));
      } catch {}
      emitModelsUpdatedEvent();
    }

    return {
      synced: true,
      models: result.models,
      meta: getGeminiCatalogMeta(),
    };
  } catch (err: any) {
    return {
      synced: false,
      models: getEffectiveGeminiModels(),
      meta: getGeminiCatalogMeta(),
      error: err?.message || 'Network error syncing Gemini models',
    };
  }
}

export function isGemini4Model(modelId?: string): boolean {
  if (!modelId) return false;
  return modelId.startsWith('gemini-4') || parseGeminiVersionScore(modelId) >= 4;
}

export function normalizeGeminiModelId(modelId?: string): string {
  const raw = (modelId || '').trim();
  if (
    !raw ||
    raw.includes('1.5') ||
    raw.includes('2.0') ||
    raw.includes('2.5') ||
    raw.includes('groq') ||
    raw.includes('llama') ||
    raw === 'gemini-pro'
  ) {
    const active = getEffectiveGeminiModels();
    return active.find((m) => m.id === DEFAULT_GEMINI_MODEL)?.id || active[0]?.id || DEFAULT_GEMINI_MODEL;
  }
  return raw;
}

export function getModelInfo(modelId?: string): AIModelDefinition {
  const normalized = normalizeGeminiModelId(modelId);
  const catalog = getEffectiveGeminiModels();
  const found = catalog.find((m) => m.id === normalized) || AI_MODEL_CATALOG.find((m) => m.id === normalized);
  if (found) return found;
  const v = parseGeminiVersionScore(normalized);
  return {
    id: normalized,
    name: formatModelDisplayName(normalized),
    tier: 'free',
    series: v >= 5 ? 'gemini-5' : isGemini4Model(normalized) ? 'gemini-4' : 'gemini-3',
    descEn: 'Custom Gemini model',
    descAr: 'نموذج Gemini مخصص',
  };
}

/**
 * Builds an API-compliant generateContent payload.
 * Gemini 4 series forbids deprecated sampling parameters (temperature, topP, topK, candidateCount)
 * and supports thinkingLevel (with XHIGH exclusive to gemini-4-hydrogen).
 */
export function buildGeminiPayload(
  prompt: string,
  model: string,
  options?: {
    systemInstruction?: string;
    jsonMode?: boolean;
    thinkingLevel?: ThinkingLevelOption;
    maxOutputTokens?: number;
  }
): Record<string, any> {
  const payload: Record<string, any> = {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
  };

  if (options?.systemInstruction) {
    payload.systemInstruction = {
      parts: [{ text: options.systemInstruction }],
    };
  }

  const genConfig: Record<string, any> = {};

  if (!isGemini4Model(model)) {
    genConfig.temperature = 0.7;
  }

  if (options?.maxOutputTokens) {
    genConfig.maxOutputTokens = options.maxOutputTokens;
  }

  if (options?.jsonMode) {
    genConfig.responseMimeType = 'application/json';
  }

  if (options?.thinkingLevel && (isGemini4Model(model) || model.includes('gemini-3') || model.includes('flash-latest') || model.includes('flash-lite-latest'))) {
    let level = options.thinkingLevel;
    // XHIGH is supported exclusively on gemini-4-hydrogen; clamp cleanly on other models
    if (level === 'XHIGH' && model !== 'gemini-4-hydrogen') {
      level = 'HIGH';
    }
    genConfig.thinkingConfig = { thinkingLevel: level };
  }

  if (Object.keys(genConfig).length > 0) {
    payload.generationConfig = genConfig;
  }

  return payload;
}

/**
 * Converts technical API error strings into clean, user-friendly feedback
 */
export function formatUserFriendlyGeminiError(rawError: string, status?: number, modelId?: string): string {
  const err = (rawError || '').toLowerCase();

  if (err.includes('api_key_invalid') || err.includes('not valid') || err.includes('invalid api key') || (status === 400 && err.includes('key'))) {
    return 'Invalid API key. Please verify that you copied the complete key from Google AI Studio.';
  }
  if (err.includes('quota') || err.includes('resource_exhausted') || status === 429) {
    if (modelId && getModelInfo(modelId).tier === 'paid') {
      return `${getModelInfo(modelId).name} requires a billing-enabled API key or hit its quota limit. Try Gemini 4 Hydrogen or switch to a paid key.`;
    }
    return 'Daily API limit reached. Please wait a short while or check your Google AI Studio plan.';
  }
  if (err.includes('network') || err.includes('failed to fetch') || err.includes('cors')) {
    return 'Connection issue. Please check your internet connection.';
  }
  if (err.includes('not found') || err.includes('is no longer available')) {
    return 'Selected model is unavailable on this key. Switched fallback to Gemini 4 Hydrogen.';
  }

  return 'Could not verify API key. Please check your key at Google AI Studio.';
}

export function getGeminiApiKey(): string {
  try {
    return localStorage.getItem(GEMINI_API_KEY_STORAGE) || '';
  } catch {
    return '';
  }
}

export function setGeminiApiKey(key: string): void {
  try {
    if (key.trim()) {
      localStorage.setItem(GEMINI_API_KEY_STORAGE, key.trim());
    } else {
      localStorage.removeItem(GEMINI_API_KEY_STORAGE);
      clearLiveGeminiModelsCache();
    }
  } catch (e) {
    console.error('Failed to set Gemini API key:', e);
  }
}

function getFallbackCandidateModels(primaryModel: string): string[] {
  const liveFree = getEffectiveGeminiModels()
    .filter((m) => m.tier === 'free')
    .map((m) => m.id);
  return [
    primaryModel,
    DEFAULT_GEMINI_MODEL,
    ...liveFree,
    'gemini-flash-latest',
    'gemini-3.5-flash-lite',
    'gemini-3.8-flash',
    'gemini-3.1-flash-lite',
  ].filter((m, i, arr) => m && arr.indexOf(m) === i);
}

/**
 * Validates a Gemini API key by making a test call with automatic model fallback
 */
export async function testGeminiApiKey(
  key: string,
  modelToTest: string = DEFAULT_GEMINI_MODEL
): Promise<{ success: boolean; error?: string; resolvedModel?: string }> {
  if (!key.trim()) {
    return { success: false, error: 'Please enter an API key.' };
  }

  const normalized = normalizeGeminiModelId(modelToTest);
  const candidateModels = getFallbackCandidateModels(normalized);

  let lastError = '';
  let lastStatus = 0;

  for (const model of candidateModels) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key.trim()}`;
      const bodyPayload = buildGeminiPayload('Hello', model, {
        maxOutputTokens: isGemini4Model(model) ? undefined : 8,
        thinkingLevel: isGemini4Model(model) ? 'LOW' : undefined,
      });

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bodyPayload),
      });

      if (res.ok) {
        return { success: true, resolvedModel: model };
      }

      lastStatus = res.status;
      const errJson = await res.json().catch(() => null);
      lastError = errJson?.error?.message || `HTTP ${res.status}`;

      if (lastError.toLowerCase().includes('api_key_invalid') || lastError.toLowerCase().includes('not valid')) {
        break;
      }
    } catch (err: any) {
      lastError = err?.message || 'Network error';
    }
  }

  return {
    success: false,
    error: formatUserFriendlyGeminiError(lastError, lastStatus, normalized),
  };
}

/**
 * Calls Gemini with user's stored API key and active model settings
 */
export async function generateWithGemini(
  prompt: string,
  options?: {
    systemInstruction?: string;
    jsonMode?: boolean;
    model?: string;
    thinkingLevel?: ThinkingLevelOption;
  }
): Promise<string> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error('Please add your API key in Settings');
  }

  const preferredModel = normalizeGeminiModelId(options?.model || DEFAULT_GEMINI_MODEL);
  const modelCandidates = getFallbackCandidateModels(preferredModel);

  let lastError = 'No response returned by Gemini model.';
  let lastStatus: number | undefined;

  for (const model of modelCandidates) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const bodyPayload = buildGeminiPayload(prompt, model, {
        systemInstruction: options?.systemInstruction,
        jsonMode: options?.jsonMode,
        thinkingLevel: options?.thinkingLevel,
      });

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bodyPayload),
      });

      if (res.ok) {
        const data = await res.json();
        const candidate = data.candidates?.[0];
        const parts: Array<{ text?: string; thought?: boolean }> = candidate?.content?.parts || [];
        const text =
          parts.find((p) => p.text && !p.thought)?.text ||
          parts[0]?.text;
        if (text) {
          return text;
        }
      }

      lastStatus = res.status;
      const errJson = await res.json().catch(() => null);
      lastError = errJson?.error?.message || `HTTP ${res.status}`;

      if (lastError.toLowerCase().includes('api_key_invalid') || lastError.toLowerCase().includes('not valid')) {
        break;
      }
    } catch (err: any) {
      lastError = err?.message || 'Network error';
    }
  }

  throw new Error(formatUserFriendlyGeminiError(lastError, lastStatus, preferredModel));
}

/**
 * Generates flashcards using Gemini
 */
export async function generateFlashcardsWithAI(
  inputText: string,
  count: number = 5,
  lang: 'ar' | 'en' = 'ar',
  model?: string,
  thinkingLevel?: ThinkingLevelOption
): Promise<Array<{ q: string; a: string; qEn?: string; aEn?: string }>> {
  const isArabic = lang === 'ar' || /[\u0600-\u06FF]/.test(inputText);

  const prompt = isArabic
    ? `أنت خبير في تلخيص وصناعة بطاقات تعليمية (Flashcards) بنظام التكرار المتباعد.
المطلوب استخراج وتوليد دقيق لـ ${count} بطاقات استذكار من المحتوى التالي:
"""
${inputText}
"""
أرجع النتيجة بصيغة JSON array فقط على النحو التالي:
[
  { "q": "السؤال أو المفهوم هنا", "a": "الإجابة النموذجية والموجزة هنا" }
]`
    : `You are an expert tutor creating high-yield spaced repetition flashcards.
Extract and generate exactly ${count} flashcards from the following study material:
"""
${inputText}
"""
Return the result as a raw JSON array of objects with "q" and "a" properties:
[
  { "q": "Question or key term here", "a": "Precise, memorable answer here" }
]`;

  const rawJson = await generateWithGemini(prompt, {
    jsonMode: true,
    model,
    thinkingLevel,
  });

  try {
    const cleanJson = rawJson.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);
    if (Array.isArray(parsed)) {
      return parsed.map((item: any) => ({
        q: String(item.q || item.question || 'Concept'),
        a: String(item.a || item.answer || 'Definition'),
      }));
    }
  } catch (err) {
    console.error('Failed to parse Gemini flashcards JSON:', err);
  }

  throw new Error('Could not parse generated flashcards into valid JSON format.');
}

/**
 * Generates interactive quiz questions using Gemini
 */
export async function generateQuizWithAI(
  topicOrText: string,
  count: number = 4,
  lang: 'ar' | 'en' = 'ar',
  model?: string,
  thinkingLevel?: ThinkingLevelOption
): Promise<Array<{ question: string; options: string[]; correctIndex: number }>> {
  const isArabic = lang === 'ar' || /[\u0600-\u06FF]/.test(topicOrText);

  const prompt = isArabic
    ? `أنت أستاذ ومعد اختبارات خبير.
أنشئ ${count} أسئلة اختيار من متعدد (4 خيارات لكل سؤال، مع تحديد الإجابة الصحيحة index من 0 إلى 3) بناءً على الموضوع التالي:
"""
${topicOrText}
"""
أرجع فقط JSON array بالشكل التالي:
[
  {
    "question": "نص السؤال هنا؟",
    "options": ["الخيار الأول", "الخيار الثاني", "الخيار الثالث", "الخيار الرابع"],
    "correctIndex": 0
  }
]`
    : `You are an expert test creator.
Create ${count} multiple-choice questions (4 options each, with 0-indexed correct answer) based on the following subject/material:
"""
${topicOrText}
"""
Return strictly a JSON array:
[
  {
    "question": "Question text here?",
    "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
    "correctIndex": 0
  }
]`;

  const rawJson = await generateWithGemini(prompt, {
    jsonMode: true,
    model,
    thinkingLevel,
  });

  try {
    const cleanJson = rawJson.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((item: any) => ({
        question: String(item.question || 'Quiz question'),
        options: Array.isArray(item.options) ? item.options.map(String) : ['A', 'B', 'C', 'D'],
        correctIndex: typeof item.correctIndex === 'number' && item.correctIndex >= 0 && item.correctIndex < (item.options?.length || 4)
          ? item.correctIndex
          : 0,
      }));
    }
  } catch (err) {
    console.error('Failed to parse Gemini quiz JSON:', err);
  }

  throw new Error('Could not parse generated quiz into valid JSON format.');
}
