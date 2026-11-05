import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '10mb' }));

/**
 * Helper to get a GoogleGenAI client with the proper telemetry header
 */
function getGenAIClient(customKey?: string) {
  const apiKey = customKey || process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

/**
 * Server endpoint to test a Gemini API key
 */
app.post('/api/gemini/test-key', async (req, res) => {
  try {
    const { apiKey, model = 'gemini-3.8-flash' } = req.body;
    const keyToUse = apiKey || process.env.GEMINI_API_KEY;

    if (!keyToUse || !keyToUse.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Please enter an API key.',
      });
    }

    const ai = getGenAIClient(keyToUse.trim());
    if (!ai) {
      return res.status(400).json({
        success: false,
        error: 'Unable to initialize Gemini client.',
      });
    }

    // List of models to test with fallback
    const candidateModels = [
      model,
      'gemini-3.8-flash',
      'gemini-3.1-flash-lite',
      'gemini-flash-latest',
    ].filter((m, i, arr) => m && arr.indexOf(m) === i);

    let lastError: any = null;
    for (const testModel of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: testModel,
          contents: 'Say hello in 1 word',
        });

        if (response && response.text) {
          return res.json({
            success: true,
            workingModel: testModel,
          });
        }
      } catch (err: any) {
        lastError = err;
      }
    }

    const errMsg = lastError?.message || 'Could not verify API key. Please check your key at Google AI Studio.';
    return res.status(400).json({
      success: false,
      error: errMsg,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err?.message || 'Failed to verify key.',
    });
  }
});

/**
 * Server endpoint to generate flashcards
 */
app.post('/api/gemini/generate-cards', async (req, res) => {
  try {
    const { prompt, count = 10, lang = 'en', apiKey, model = 'gemini-3.8-flash' } = req.body;
    const keyToUse = apiKey || process.env.GEMINI_API_KEY;

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ error: 'Prompt or study notes text is required.' });
    }

    const ai = getGenAIClient(keyToUse ? keyToUse.trim() : undefined);
    if (!ai) {
      return res.status(400).json({
        error: 'No Gemini API key available. Please add your API key in Settings.',
      });
    }

    const systemPrompt =
      lang === 'ar'
        ? `أنت خبير تعليمي في صياغة بطاقات الاستذكار الفعالة (Flashcards).
قم باستخراج أهم المفاهيم من النص المقدم وصياغتها في صورة أسئلة وأجوبة دقيقة وشاملة.
يجب أن يكون الناتج عبارة عن مصفوفة JSON نقية فقط بدون أي نصوص قبلها أو بعدها:
[
  {"q": "السؤال هنا", "a": "الجواب المفصل هنا"}
]
المطلوب إنشاء ${count} بطاقات باللغة العربية.`
        : `You are an expert tutor specialized in creating high-yield active recall flashcards.
Extract the key concepts from the provided study text and create clear, concise question-and-answer pairs.
Output ONLY a raw valid JSON array of objects with no surrounding markdown or explanation:
[
  {"q": "Question here", "a": "Detailed answer here"}
]
Generate exactly ${count} flashcards in English.`;

    const candidateModels = [
      model,
      'gemini-3.8-flash',
      'gemini-3.1-flash-lite',
      'gemini-flash-latest',
    ].filter((m, i, arr) => m && arr.indexOf(m) === i);

    let lastError: any = null;
    for (const chosenModel of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: chosenModel,
          contents: `${systemPrompt}\n\nStudy Content:\n${prompt}`,
        });

        const raw = response.text || '';
        // Extract JSON array
        const jsonMatch = raw.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return res.json({
              success: true,
              cards: parsed.map((item: any) => ({
                q: String(item.q || item.question || '').trim(),
                a: String(item.a || item.answer || '').trim(),
              })),
            });
          }
        }
      } catch (err: any) {
        lastError = err;
      }
    }

    return res.status(500).json({
      error: lastError?.message || 'Failed to generate flashcards from the provided content.',
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Server error during generation.' });
  }
});

// Mount Vite in development or serve static build in production
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`StudyFlow server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
