import { useState, useEffect, useCallback } from 'react';
import {
  AIModelDefinition,
  GEMINI_MODELS_UPDATED_EVENT,
  LiveCatalogMeta,
  getEffectiveGeminiModels,
  getGeminiApiKey,
  getGeminiCatalogMeta,
  syncGeminiModels,
} from '../utils/gemini.ts';

export function useGeminiModels(autoSyncOnMount: boolean = true) {
  const [models, setModels] = useState<AIModelDefinition[]>(() => getEffectiveGeminiModels());
  const [meta, setMeta] = useState<LiveCatalogMeta>(() => getGeminiCatalogMeta());
  const [isSyncing, setIsSyncing] = useState(false);

  const reloadFromStore = useCallback(() => {
    setModels(getEffectiveGeminiModels());
    setMeta(getGeminiCatalogMeta());
  }, []);

  const refreshModels = useCallback(async (force: boolean = true, overrideKey?: string) => {
    setIsSyncing(true);
    try {
      const res = await syncGeminiModels(overrideKey, { force });
      setModels(res.models);
      setMeta(res.meta);
      return res;
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    const onUpdate = () => reloadFromStore();
    window.addEventListener(GEMINI_MODELS_UPDATED_EVENT, onUpdate);
    window.addEventListener('storage', onUpdate);

    if (autoSyncOnMount && getGeminiApiKey()) {
      syncGeminiModels(undefined, { force: false }).then((res) => {
        if (res.synced) {
          setModels(res.models);
          setMeta(res.meta);
        }
      });
    }

    return () => {
      window.removeEventListener(GEMINI_MODELS_UPDATED_EVENT, onUpdate);
      window.removeEventListener('storage', onUpdate);
    };
  }, [autoSyncOnMount, reloadFromStore]);

  return { models, meta, isSyncing, refreshModels };
}
