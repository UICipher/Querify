import React, { useState } from 'react';

export default function Home() {
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState([
    { id: '1', query: 'Show me the revenue report', status: 'success' },
    { id: '2', query: 'DROP TABLE users; -- test', status: 'blocked' }
  ]);

  const handleClearHistory = () => {
    setHistory([]);
  };

  return (
    <div className="min-h-screen bg-[#04070f] text-[#f7f8ff] p-6 font-sans">
      <header className="max-w-6xl mx-auto flex justify-between items-center py-4 border-b border-white/10 mb-8">
        <div className="flex items-center gap-3">
          <span className="calligraphy-q text-2xl text-indigo-400 font-bold">Q</span>
          <span className="text-xl font-bold tracking-tight text-white">Querify</span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800">Enterprise Studio</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-xs text-slate-300 flex items-center gap-2 bg-[#0d1322] px-3 py-1.5 rounded-lg border border-indigo-500/30">
            <span className="w-2 h-2 rounded-full bg-pink-400"></span>
            <span>Frontend: <strong>Nazish</strong> (Female Architect & Original Web Vision - She designed the core layout)</span>
          </div>
          <button 
            onClick={handleClearHistory}
            className="interactive-btn px-3.5 py-1.5 text-xs bg-red-950/60 hover:bg-red-900/80 text-red-200 rounded-lg border border-red-800/50 transition-all cursor-pointer font-semibold"
          >
            Clear History
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="console-card p-6 rounded-xl border border-indigo-500/20 bg-[#0d1322]/80 backdrop-blur-md">
            <h2 className="text-lg font-bold mb-2 text-white">Query Console</h2>
            <p className="text-sm text-slate-400 mb-4">Turn an imprecise question into a decision-ready answer with secure SQL guardrails.</p>
            
            <div className="flex gap-2">
              <input 
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask a business question (e.g., revenue report)..."
                className="flex-1 bg-[#070b14] border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              />
              <button className="interactive-btn px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-lg shadow-lg shadow-indigo-500/25 cursor-pointer">
                Run Query
              </button>
            </div>
          </div>

          <div className="pipeline-card p-6 rounded-xl border border-indigo-500/20 bg-[#0d1322]/80 backdrop-blur-md">
            <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-800">
              <span className="text-xs font-mono text-indigo-400">// querify-pipeline active preview</span>
              <div className="flex gap-1.5">
                <span className="px-2 py-0.5 rounded bg-indigo-600 text-white text-[10px]">Step 1</span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]">Step 2</span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]">Step 3</span>
              </div>
            </div>
            <p className="text-xs text-slate-300">Multi-turn clarification loop, ambiguity detector, and security guardrails are fully operational.</p>
          </div>
        </div>

        <div className="console-card p-6 rounded-xl border border-indigo-500/20 bg-[#0d1322]/80 backdrop-blur-md space-y-4">
          <h3 className="text-sm font-bold text-slate-200">Audit Trail & History</h3>
          <div className="space-y-2">
            {history.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No recent history found.</p>
            ) : (
              history.map((item) => (
                <div key={item.id} className="p-2.5 rounded bg-[#070b14] border border-slate-800 text-xs flex justify-between items-center">
                  <span className="truncate max-w-[160px] text-slate-300">{item.query}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] ${item.status === 'success' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40' : 'bg-red-950 text-red-400 border border-red-800/40'}`}>
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
