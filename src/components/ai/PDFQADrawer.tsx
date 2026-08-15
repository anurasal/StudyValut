import React, { useState, useRef, useEffect } from 'react';
import { askPdfQuestion } from '../../lib/api';
import { Send, Bot, User, Sparkles, X, Loader2, Info } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
}

interface PDFQADrawerProps {
  isOpen: boolean;
  onClose: () => void;
  pdfBase64?: string;
  textContent?: string;
  fileName: string;
}

export const PDFQADrawer: React.FC<PDFQADrawerProps> = ({
  isOpen,
  onClose,
  pdfBase64,
  textContent,
  fileName,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm-0',
      role: 'model',
      text: `Hello! Ask me any question about "${fileName}". I will answer strictly based on the content of this document.`,
    },
  ]);
  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  if (!isOpen) return null;

  const handleSend = async (questionText?: string) => {
    const q = questionText || input;
    if (!q.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: 'usr-' + Date.now(),
      role: 'user',
      text: q.trim(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!questionText) setInput('');
    setLoading(true);

    try {
      const historyPayload = messages
        .filter((m) => m.id !== 'm-0')
        .map((m) => ({ role: m.role, text: m.text }));

      const answer = await askPdfQuestion({
        question: q.trim(),
        pdfBase64,
        textContent,
        fileName,
        history: historyPayload,
      });

      const aiMsg: ChatMessage = {
        id: 'ai-' + Date.now(),
        role: 'model',
        text: answer,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: 'err-' + Date.now(),
          role: 'model',
          text: 'Error processing question: ' + (err.message || 'Server error'),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const sampleQuestions = [
    'Explain the main concept in simple terms',
    'What are the key definitions or formulas?',
    'What questions from this doc are likely in exams?',
  ];

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col">
      {/* Drawer Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/60">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-md">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Ask AI about PDF</h3>
            <p className="text-[10px] text-slate-500 truncate max-w-[220px]">{fileName}</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Notice Banner */}
      <div className="px-4 py-2 bg-purple-50 dark:bg-purple-950/40 border-b border-purple-200 dark:border-purple-900/40 text-[11px] text-purple-900 dark:text-purple-300 flex items-center gap-2">
        <Info className="w-3.5 h-3.5 shrink-0 text-purple-600" />
        <span>Answers are strictly based on this document.</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex items-start gap-2.5 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 ${
                m.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-purple-600 text-white shadow-sm'
              }`}
            >
              {m.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
            </div>

            <div
              className={`p-3 rounded-2xl text-xs max-w-[85%] leading-relaxed ${
                m.role === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-none'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 rounded-tl-none border border-slate-200/80 dark:border-slate-700/60'
              }`}
            >
              <div className="whitespace-pre-wrap">{m.text}</div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-purple-600 dark:text-purple-400 font-medium">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Analyzing PDF and formulating answer...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Sample Quick Prompts */}
      <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40">
        <p className="text-[10px] font-semibold text-slate-400 mb-1">Quick Prompts:</p>
        <div className="flex flex-wrap gap-1">
          {sampleQuestions.map((q) => (
            <button
              key={q}
              onClick={() => handleSend(q)}
              disabled={loading}
              className="text-[10px] px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-purple-400 text-slate-700 dark:text-slate-300 transition-all text-left truncate max-w-full disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 bg-white dark:bg-slate-900"
      >
        <input
          type="text"
          placeholder="Ask a question about this PDF..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="p-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-500/20 disabled:opacity-50 transition-all"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
