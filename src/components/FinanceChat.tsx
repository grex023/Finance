import React, { useState, useRef } from 'react';

const PROVIDERS = [
  { value: 'ollama', label: 'Ollama (local)' },
  { value: 'openai', label: 'OpenAI (ChatGPT)' },
];

export default function FinanceChat() {
  const [provider, setProvider] = useState('ollama');
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; content: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

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
          openaiApiKey: provider === 'openai' ? openaiApiKey : undefined,
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
    <div className="fixed bottom-0 left-0 w-full bg-white border-t z-50 shadow-lg p-2 sm:p-4" style={{ maxWidth: 600, margin: '0 auto', right: 0 }}>
      <div className="max-h-48 overflow-y-auto mb-2 px-1" style={{ minHeight: 80 }}>
        {messages.map((msg, i) => (
          <div key={i} className={`mb-1 text-sm ${msg.role === 'user' ? 'text-right' : 'text-left text-blue-700'}`}>{msg.content}</div>
        ))}
        <div ref={chatEndRef} />
      </div>
      <div className="flex gap-2 items-center">
        <select
          className="border rounded px-2 py-1 mr-2"
          value={provider}
          onChange={e => setProvider(e.target.value)}
        >
          <option value="ollama">Ollama (Llama 3)</option>
        </select>
        {provider === 'openai' && (
          <input
            className="border rounded px-2 py-1 text-sm w-32"
            type="password"
            placeholder="OpenAI API Key"
            value={openaiApiKey}
            onChange={e => setOpenaiApiKey(e.target.value)}
          />
        )}
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
          disabled={loading || !input.trim() || (provider === 'openai' && !openaiApiKey)}
        >
          {loading ? '...' : 'Send'}
        </button>
      </div>
    </div>
  );
} 