'use client';

import { useState } from 'react';
import { quickAddSite, batchAddSites, type QuickAddResult } from './actions';

export default function AdminAddPage() {
  const [singleUrl, setSingleUrl] = useState('');
  const [batchUrls, setBatchUrls] = useState('');
  const [singleResult, setSingleResult] = useState<QuickAddResult | null>(null);
  const [batchResults, setBatchResults] = useState<QuickAddResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'single' | 'batch'>('single');

  async function handleSingleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!singleUrl.trim() || loading) return;

    setLoading(true);
    setSingleResult(null);

    try {
      const result = await quickAddSite(singleUrl.trim());
      setSingleResult(result);
      if (result.success) setSingleUrl('');
    } catch (err) {
      setSingleResult({
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleBatchAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!batchUrls.trim() || loading) return;

    setLoading(true);
    setBatchResults([]);

    const urls = batchUrls
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.startsWith('http'));

    try {
      const results = await batchAddSites(urls);
      setBatchResults(results);
    } catch (err) {
      setBatchResults([
        {
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-rajdhani text-2xl font-bold text-white">
          Add Sites
        </h2>
        <p className="mt-1 text-sm text-zinc-400">
          Quick-add sites through the full pipeline (score + tag + route).
        </p>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setMode('single')}
          className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            mode === 'single'
              ? 'bg-emerald-600 text-white'
              : 'bg-zinc-800 text-zinc-400 hover:text-white'
          }`}
        >
          Single URL
        </button>
        <button
          onClick={() => setMode('batch')}
          className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            mode === 'batch'
              ? 'bg-emerald-600 text-white'
              : 'bg-zinc-800 text-zinc-400 hover:text-white'
          }`}
        >
          Batch Import
        </button>
      </div>

      {mode === 'single' ? (
        <form onSubmit={handleSingleAdd} className="space-y-4">
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-zinc-300">
              URL
            </label>
            <div className="mt-1 flex gap-2">
              <input
                id="url"
                type="url"
                value={singleUrl}
                onChange={(e) => setSingleUrl(e.target.value)}
                placeholder="https://cool-obscure-site.com"
                className="flex-1 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Add & Score'}
              </button>
            </div>
          </div>

          {singleResult && (
            <div
              className={`rounded-md border p-4 ${
                singleResult.success
                  ? 'border-emerald-900/50 bg-emerald-950/30'
                  : singleResult.blocked
                    ? 'border-amber-900/50 bg-amber-950/30'
                    : 'border-red-900/50 bg-red-950/30'
              }`}
            >
              {singleResult.success ? (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-emerald-400">
                    Added: {singleResult.title}
                  </p>
                  <p className="text-xs text-zinc-400">
                    Score: {singleResult.score} | Decision: {singleResult.decision}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-red-400">
                  {singleResult.blocked && '(Blocked) '}
                  {singleResult.duplicate && '(Duplicate) '}
                  {singleResult.error}
                </p>
              )}
            </div>
          )}
        </form>
      ) : (
        <form onSubmit={handleBatchAdd} className="space-y-4">
          <div>
            <label
              htmlFor="batch"
              className="block text-sm font-medium text-zinc-300"
            >
              URLs (one per line)
            </label>
            <textarea
              id="batch"
              value={batchUrls}
              onChange={(e) => setBatchUrls(e.target.value)}
              placeholder={
                'https://site-one.com\nhttps://site-two.com\nhttps://site-three.com'
              }
              rows={10}
              className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-sm text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Import All'}
          </button>

          {batchResults.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-zinc-400">
                {batchResults.filter((r) => r.success).length} added,{' '}
                {batchResults.filter((r) => !r.success).length} failed
              </p>
              <div className="max-h-64 overflow-y-auto rounded-md border border-zinc-800 bg-zinc-900/50">
                {batchResults.map((result, i) => (
                  <div
                    key={i}
                    className={`border-b border-zinc-800 px-3 py-2 text-xs last:border-0 ${
                      result.success ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {result.success
                      ? `${result.title} — score ${result.score} (${result.decision})`
                      : result.error}
                  </div>
                ))}
              </div>
            </div>
          )}
        </form>
      )}
    </div>
  );
}
