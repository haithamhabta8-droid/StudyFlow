/**
 * Bring Your Own Key (BYOK) Gemini API Integration
 * Key is stored securely in localStorage ('gemini_api_key')
 */

export const GEMINI_API_KEY_STORAGE = 'gemini_api_key';
export const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';

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
 * Validates a Gemini API key by making a minimal test call
 */
export async function testGeminiApiKey(key: string): Promise<{ success: boolean; error?: string }> {
  if (!key.trim()) {
    return { success: false, error: 'Please enter an API key.' };
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${DEFAULT_GEMINI_MODEL}:generateContent?key=${key.trim()}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: 'Respond with the single word "OK"' }],
          },
        ],
        generationConfig: {
          maxOutputTokens: 10,
        },
      }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      const msg = errJson?.error?.message || `HTTP ${res.status} error`;
      return { success: false, error: msg };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error connecting to Gemini API.' };
  }
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
    const msg = errJson?.error?.message || `Gemini API error (Status ${res.status})`;
    if (res.status === 400 || res.status === 403) {
      throw new Error(`API Key invalid or quota exceeded: ${msg}`);
    }
    throw new Error(msg);
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

