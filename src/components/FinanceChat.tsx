import React, { useState, useRef } from 'react';
import { MessageCircle } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

const PROVIDERS = [
  { value: 'ollama', label: 'Ollama (local)' },
  { value: 'openai', label: 'OpenAI (ChatGPT)' },
];

export default function FinanceChat() {
  const provider = 'ollama';
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; content: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    setMessages((msgs) => [...msgs, { role: 'user', content: input }]);
    setLoading(true);
    try {
      const baseUrl = 'http://192.168.3.10:5001/api';
      const res = await fetch(`${baseUrl}/ai-finance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: input,
          provider,
        }),
      });
      const data = await res.json();
      setMessages((msgs) => [...msgs, { role: 'ai', content: data.answer || data.error || 'No response.' }]);
    } catch (err) {
      setMessages((msgs) => [...msgs, { role: 'ai', content: 'Error contacting AI backend.' }]);
    }
    setInput('');
    setLoading(false);
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  return (
    <div>
      {/* Floating Chat Icon */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            className="fixed bottom-6 right-6 z-50 bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
            aria-label="Open chat"
          >
            <MessageCircle className="h-7 w-7" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" sideOffset={12} className="p-0 rounded-2xl shadow-2xl w-80 max-w-[95vw]">
          <div className="flex flex-col h-96 bg-white rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b">
              <span className="font-semibold text-blue-700">Finance Chat</span>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-700 text-xl font-bold">×</button>
            </div>
            <div className="flex-1 max-h-56 overflow-y-auto mb-2 px-4 py-2" style={{ minHeight: 80 }}>
              {messages.map((msg, i) => (
                <div key={i} className={`mb-1 text-sm ${msg.role === 'user' ? 'text-right' : 'text-left text-blue-700'}`}>{msg.content}</div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div className="flex gap-2 items-center px-4 pb-4">
              <input
                className="flex-1 border rounded px-2 py-1 text-sm"
                type="text"
                placeholder="Ask about your finances..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !loading) sendMessage(); }}
                disabled={loading}
              />
              <button
                className="bg-blue-600 text-white px-3 py-1 rounded disabled:opacity-50"
                onClick={sendMessage}
                disabled={loading || !input.trim()}
              >
                {loading ? '...' : 'Send'}
              </button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
} 