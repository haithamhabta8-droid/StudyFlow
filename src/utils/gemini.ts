/**
 * Bring Your Own Key (BYOK) Gemini API Integration
 * Key is stored securely in localStorage ('gemini_api_key')
 */

export const GEMINI_API_KEY_STORAGE = 'gemini_api_key';
export const DEFAULT_GEMINI_MODEL = 'gemini-3.8-flash';

/**
 * Converts technical API error strings into clean, user-friendly feedback
 */
export function formatUserFriendlyGeminiError(rawError: string, status?: number): string {
  const err = (rawError || '').toLowerCase();

  if (err.includes('api_key_invalid') || err.includes('not valid') || err.includes('invalid api key') || (status === 400 && err.includes('key'))) {
    return 'Invalid API key. Please verify that you copied the complete key from Google AI Studio.';
  }
  if (err.includes('quota') || err.includes('resource_exhausted') || status === 429) {
    return 'Daily API limit reached. Please wait a short while or check your Google AI Studio plan.';
  }
  if (err.includes('network') || err.includes('failed to fetch') || err.includes('cors')) {
    return 'Connection issue. Please check your internet connection.';
  }
  if (err.includes('not found') || err.includes('is no longer available')) {
    return 'Model updated to latest version (Gemini 3.8 Flash). Please test again.';
  }

  // Friendly human-readable fallback (no raw JSON or developer links)
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
    }
  } catch (e) {
    console.error('Failed to set Gemini API key:', e);
  }
}

/**
 * Validates a Gemini API key by making a test call with automatic model fallback
 */
export async function testGeminiApiKey(
  key: string,
  modelToTest: string = DEFAULT_GEMINI_MODEL
): Promise<{ success: boolean; error?: string }> {
  if (!key.trim()) {
    return { success: false, error: 'Please enter an API key.' };
  }

  // List of models to try in order
  const candidateModels = [
    modelToTest,
    'gemini-3.8-flash',
    'gemini-3.1-flash-lite',
    'gemini-flash-latest',
  ].filter((m, i, arr) => m && arr.indexOf(m) === i);

  let lastError = '';
  let lastStatus = 0;

  for (const model of candidateModels) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key.trim()}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: 'Hello' }],
            },
          ],
          generationConfig: {
            maxOutputTokens: 5,
          },
        }),
      });

      if (res.ok) {
        return { success: true };
      }

      lastStatus = res.status;
      const errJson = await res.json().catch(() => null);
      lastError = errJson?.error?.message || `HTTP ${res.status}`;

      // If it's a key issue (invalid key), don't try other models—it's invalid
      if (lastError.toLowerCase().includes('api_key_invalid') || lastError.toLowerCase().includes('not valid')) {
        break;
      }
    } catch (err: any) {
      lastError = err?.message || 'Network error';
    }
  }

  return {
    success: false,
    error: formatUserFriendlyGeminiError(lastError, lastStatus),
  };
}

/**
 * Calls Gemini with user's stored API key
 */
export async function generateWithGemini(
  prompt: string,
  options?: {
    systemInstruction?: string;
    jsonMode?: boolean;
    model?: string;
  }
): Promise<string> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error('Please add your API key in Settings');
  }

  const model = options?.model || DEFAULT_GEMINI_MODEL;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const bodyPayload: any = {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: 0.7,
    },
  };

  if (options?.systemInstruction) {
    bodyPayload.systemInstruction = {
      parts: [{ text: options.systemInstruction }],
    };
  }

  if (options?.jsonMode) {
    bodyPayload.generationConfig.responseMimeType = 'application/json';
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(bodyPayload),
  });

  if (!res.ok) {
    const errJson = await res.json().catch(() => null);
    const msg = errJson?.error?.message || `Status ${res.status}`;
    throw new Error(formatUserFriendlyGeminiError(msg, res.status));
  }

  const data = await res.json();
  const candidate = data.candidates?.[0];
  const text = candidate?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error('No response returned by Gemini model.');
  }

  return text;
}

/**
 * Generates flashcards using Gemini
 */
export async function generateFlashcardsWithAI(
  inputText: string,
  count: number = 5,
  lang: 'ar' | 'en' = 'ar'
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
  lang: 'ar' | 'en' = 'ar'
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

