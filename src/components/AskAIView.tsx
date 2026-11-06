import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  RotateCcw,
  BookOpen,
  ArrowRight,
  Loader2,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';
import { Category } from '../types/index.ts';
import { getGeminiApiKey, generateWithGemini } from '../utils/gemini.ts';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  ts: number;
}

interface AskAIViewProps {
  category?: Category | null;
  lang: 'ar' | 'en';
  onOpenSettings: () => void;
}

export const AskAIView: React.FC<AskAIViewProps> = ({
  category,
  lang,
  onOpenSettings,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const apiKey = getGeminiApiKey();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const suggestions = lang === 'ar'
    ? [
        'لخص لي أهم المفاهيم الأساسية في هذه المادة',
        'أنشئ لي اختباراً تدريبياً من 5 أسئلة اختيار من متعدد',
        'اشرح لي أصعب مفهوم دراسي بأسلوب مبسط بالأمثلة',
        'اقترح عليّ أسئلة استرجاع نشط لمراجعتها قبل الامتحان',
      ]
    : [
        'Summarize the core concepts of this subject',
        'Create a 5-question multiple choice drill',
        'Explain the hardest formula or theory step-by-step',
        'Generate active recall questions for my exam',
      ];

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isLoading) return;

    if (!apiKey) {
      onOpenSettings();
      return;
    }

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text,
      ts: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const subjectContext = category
        ? `Category / Subject: ${category.name}. Existing decks: ${
            category.decks?.map((d) => d.name).join(', ') || 'General'
          }.`
        : 'General Study Session.';

      const systemInstruction = `You are StudyFlow's expert AI Tutor powered by Google Gemini 3.8 Flash.
Provide clear, structured, encouraging, and pedagogically sound responses to student questions.
Format responses with bullet points, bold key terms, and concise paragraphs.
Context: ${subjectContext}
Language: ${lang === 'ar' ? 'Arabic' : 'English'}`;

      const aiReply = await generateWithGemini(text, {
        systemInstruction,
        model: 'gemini-3.8-flash',
      });

      const assistantMsg: Message = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: aiReply,
        ts: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: err?.message || 'Sorry, I encountered an error connecting to Gemini.',
        ts: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-140px)] rounded-3xl bg-[#0e0e22] border border-[#2a2a4a] overflow-hidden shadow-2xl">
      {/* 1. Modern Chat Header */}
      <div className="p-4 px-6 bg-[#12122a] border-b border-[#2a2a4a] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-sm text-[#e8e8f0]">
                {lang === 'ar' ? 'المساعد الدراسي الذكي (Ask AI)' : 'StudyFlow AI Tutor'}
              </h2>
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>gemini-3.8-flash</span>
              </span>
            </div>
            {category && (
              <span className="text-[11px] text-[#8888a8]">
                {lang === 'ar' ? 'سياق المادة:' : 'Context:'} {category.name}
              </span>
            )}
          </div>
        </div>

        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1c1c3a] border border-[#2a2a4a] text-xs font-semibold text-[#8888a8] hover:text-[#e8e8f0] transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'محادثة جديدة' : 'New Chat'}</span>
          </button>
        )}
      </div>

      {/* 2. Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.length === 0 ? (
          /* Centered Welcome Area with Sparkle & 4 Suggestion Buttons in Grid */
          <div className="h-full flex flex-col items-center justify-center text-center max-w-xl mx-auto py-8 space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-purple-600 to-teal-400 p-0.5 shadow-xl shadow-purple-600/30">
              <div className="w-full h-full rounded-[22px] bg-[#12122a] flex items-center justify-center text-purple-400">
                <Sparkles className="w-8 h-8 animate-pulse" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-extrabold text-[#e8e8f0]">
                {lang === 'ar'
                  ? 'كيف يمكنني مساعدتك في دراستك اليوم؟'
                  : 'How can I help you study today?'}
              </h3>
              <p className="text-xs text-[#8888a8] leading-relaxed max-w-md mx-auto">
                {lang === 'ar'
                  ? 'اسأل أي استفسار دراسي، اطلب تلخيص المحاضرات، أو تدرب على أسئلة امتحانات ذكية مدعومة بمحرك Gemini 3.8 Flash.'
                  : 'Ask course questions, request summaries, or test your comprehension with high-yield practice drills powered by Gemini 3.8 Flash.'}
              </p>
            </div>

            {/* 4 Suggestion Buttons in Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full pt-2">
              {suggestions.map((sug, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(sug)}
                  className="p-3.5 rounded-2xl bg-[#12122a] border border-[#2a2a4a] hover:border-purple-500/50 hover:bg-[#1c1c3a] text-start text-xs font-semibold text-[#e8e8f0] flex items-center justify-between gap-3 group transition-all hover:-translate-y-0.5 active:scale-95 shadow-sm"
                >
                  <span className="line-clamp-2">{sug}</span>
                  <ArrowRight className="w-4 h-4 text-purple-400 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform shrink-0" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0 mt-1">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium shadow-md'
                    : 'bg-[#12122a] border border-[#2a2a4a] text-[#e8e8f0] relative group'
                }`}
              >
                {msg.role === 'assistant' && (
                  <button
                    onClick={() => handleCopy(msg.id, msg.content)}
                    className="absolute top-3 end-3 opacity-0 group-hover:opacity-100 p-1 text-[#8888a8] hover:text-white transition-opacity"
                    title="Copy response"
                  >
                    {copiedId === msg.id ? (
                      <Check className="w-3.5 h-3.5 text-teal-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
                <div className="whitespace-pre-wrap">{msg.content}</div>
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center text-white shrink-0 mt-1 font-bold text-xs">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="p-3.5 rounded-2xl bg-[#12122a] border border-[#2a2a4a] text-xs text-purple-300 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>
                {lang === 'ar'
                  ? 'Gemini 3.8 Flash يفكر في إجابتك...'
                  : 'Gemini 3.8 Flash is thinking...'}
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 3. Fixed Bottom Input Bar */}
      <div className="p-4 bg-[#12122a] border-t border-[#2a2a4a] shrink-0">
        {!apiKey ? (
          <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/30 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-purple-200">
              <AlertCircle className="w-4 h-4 text-purple-400 shrink-0" />
              <span>
                {lang === 'ar'
                  ? 'يرجى إدخال مفتاح Gemini API في الإعدادات لتشغيل المحادثة الذكية.'
                  : 'Please enter your Gemini API key in Settings to activate the AI tutor.'}
              </span>
            </div>
            <button
              onClick={onOpenSettings}
              className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shrink-0"
            >
              {lang === 'ar' ? 'الإعدادات' : 'Settings'}
            </button>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              disabled={isLoading}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                lang === 'ar'
                  ? 'اكتب سؤالك الدراسي أو اطلب شرح مفهوم...'
                  : 'Ask your study question or request an explanation...'
              }
              className="flex-1 px-4 py-3 rounded-2xl bg-[#1c1c3a] border border-[#2a2a4a] text-xs sm:text-sm text-[#e8e8f0] focus:outline-none focus:border-purple-500 transition-colors"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="p-3 rounded-2xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-bold transition-all shadow-md shadow-purple-600/30 active:scale-95 shrink-0"
              title="Send Message"
            >
              <Send className="w-4 h-4 rtl:rotate-180" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
