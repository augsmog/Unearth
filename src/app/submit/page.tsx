'use client';

import { useState } from 'react';
import Link from 'next/link';
import { submitSite, type SubmitResult } from './actions';

export default function SubmitPage() {
  const [url, setUrl] = useState('');
  const [reason, setReason] = useState('');
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim() || loading) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await submitSite(url.trim(), reason.trim() || undefined);
      setResult(res);
      if (res.success) {
        setUrl('');
        setReason('');
      }
    } catch {
      setResult({ success: false, error: 'Something went wrong. Please try again.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <Link
            href="/discover"
            className="font-rajdhani text-2xl font-bold tracking-wider text-white"
          >
            Unearth
          </Link>
          <h1 className="mt-4 text-xl font-semibold text-white">
            Know a hidden gem?
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            We&apos;re looking for indie, obscure, hard-to-find websites that
            people wouldn&apos;t typically discover through Google. Personal
            projects, niche tools, passion blogs — the weirder the better.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="url"
              className="block text-sm font-medium text-zinc-300"
            >
              URL
            </label>
            <input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://some-cool-obscure-site.com"
              className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              required
            />
          </div>

          <div>
            <label
              htmlFor="reason"
              className="block text-sm font-medium text-zinc-300"
            >
              Why is this cool?{' '}
              <span className="text-zinc-500">(optional)</span>
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="I found this random site that..."
              rows={3}
              maxLength={500}
              className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit Site'}
          </button>
        </form>

        {result && (
          <div
            className={`mt-4 rounded-md border p-4 ${
              result.success
                ? 'border-emerald-900/50 bg-emerald-950/30'
                : 'border-red-900/50 bg-red-950/30'
            }`}
          >
            <p
              className={`text-sm ${
                result.success ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {result.success
                ? "Thanks! We'll review your submission and add it if it fits."
                : result.error}
            </p>
          </div>
        )}

        <p className="mt-6 text-center text-xs text-zinc-600">
          Not sure what we&apos;re looking for?{' '}
          <Link
            href="/discover"
            className="text-zinc-400 underline hover:text-white"
          >
            Explore existing finds
          </Link>
        </p>
      </div>
    </div>
  );
}
