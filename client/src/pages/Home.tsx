import React, { useState, useEffect } from 'react';

export default function Home() {
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState([
    { id: '1', query: 'Show me the revenue report', status: 'success' },
    { id: '2', query: 'DROP TABLE users; -- test', status: 'blocked' }
  ]);

  // Clear History Handler Fix
  const handleClearHistory = () => {
    setHistory([]);
  };

  return (
    <div className="min-h-screen bg-[#07090d] text-slate-100 p-6 font-sans">
      <header className="max-w-6xl mx-auto flex justify-between items-center py-4 border-b border-white/10 mb-8">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold tracking-tight text-cyan-400">Querify</span>
          <span className="text-xs px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">Enterprise Studio</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-slate-400">Collaborator: Nazish (Frontend Architect & Original Web Vision - She designed the core layout)</span>
          <button 
            onClick={handleClearHistory}
            className="interactive-btn px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md border border-white/10 transition-all cursor-pointer"
          >
            Clear History
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="glass-card-glow p-6 rounded-xl border border-white/10 bg-[#0c1017] transition-all hover:border-cyan-500/40">
            <h2 className="text-lg font-semibold mb-2">Query Console</h2>
            <p className="text-sm text-slate-400 mb-4">Turn an imprecise question into a decision-ready answer with secure SQL guardrails.</p>
            
            <div className="flex gap-2">
              <input 
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask a business question (e.g., revenue report)..."
                className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500"
              />
              <button className="interactive-btn px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-sm rounded-lg shadow-lg shadow-cyan-500/20 cursor-pointer transition-all hover:-translate-y-0.5">
                Run Query
              </button>
            </div>
          </div>

          <div className="glass-card-glow p-6 rounded-xl border border-white/10 bg-[#0c1017]">
            <h3 className="text-sm font-semibold text-slate-300 mb-2">// querify-pipeline active preview</h3>
            <p className="text-xs text-slate-400">Multi-turn clarification flow & security guardrails are fully operational.</p>
          </div>
        </div>

        <div className="glass-card-glow p-6 rounded-xl border border-white/10 bg-[#0c1017] space-y-4">
          <h3 className="text-sm font-semibold text-slate-200">Audit Trail & History</h3>
          <div className="space-y-2">
            {history.length === 0 ? (
              <p className="text-xs text-slate-500">No recent queries in history.</p>
            ) : (
              history.map((item) => (
                <div key={item.id} className="p-2.5 rounded bg-black/30 border border-white/5 text-xs flex justify-between items-center">
                  <span className="truncate max-w-[180px] text-slate-300">{item.query}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] ${item.status === 'success' ? 'bg-emerald-950 text-emerald-400' : 'bg-red-950 text-red-400'}`}>
                    {item.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
