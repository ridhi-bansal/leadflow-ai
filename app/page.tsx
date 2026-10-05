import { LeadForm } from '@/components/lead-form';
import { Sparkles, Cpu, Compass, CheckCircle } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex-1 flex flex-col">
      {/* Top Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-sm">
              <Sparkles className="w-5 h-5 text-blue-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 tracking-tight text-base">
                  LeadFlow AI
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full">
                  v0.1 Slice
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Agency Lead Qualification System
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200">
              <Compass className="w-3.5 h-3.5 text-blue-600" />
              <span>Client: <strong>Northstar Studio</strong> (US Agency)</span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero / Context Subheader */}
      <section className="bg-gradient-to-b from-white to-slate-50 border-b border-slate-200 py-10 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100 text-xs font-semibold">
            <Cpu className="w-3.5 h-3.5 text-blue-600" />
            Milestone 2: AI Qualification & Human Email Approval
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            AI Lead Qualification & Human-in-the-Loop Follow-ups
          </h1>
          <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Automatically ingest leads, extract structured scope signals via Google Gemini, calculate
            deterministic qualification scores, and generate personalized reply drafts with explicit human approval.
          </p>

          {/* Value props pill row */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Supabase Storage
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Gemini Structured AI
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Deterministic 0–100 Score
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> AI Draft + Human Approval
            </span>
          </div>
        </div>
      </section>

      {/* Main Interactive Work Area */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-10">
        <LeadForm />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">LeadFlow AI</span>
            <span>—</span>
            <span>Portfolio Project for Northstar Studio</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Next.js 15 App Router</span>
            <span>•</span>
            <span>Supabase PostgreSQL</span>
            <span>•</span>
            <span>Google Gen AI SDK</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
