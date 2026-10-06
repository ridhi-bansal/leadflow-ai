'use client';

import React, { useState } from 'react';
import { LeadForm } from '@/components/lead-form';
import { LeadDashboard } from '@/components/lead-dashboard';
import { DraftsManager } from '@/components/drafts-manager';
import {
  Sparkles,
  LayoutDashboard,
  Inbox,
  Mail,
  PlusCircle,
  Compass,
} from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'leads' | 'drafts' | 'intake'>('dashboard');

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50/60">
      {/* Top Header & Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo & Agency Identity */}
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
                  Agency OS
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Lead Intelligence &amp; Draft Orchestration
              </p>
            </div>
          </div>

          {/* Agency Context */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200">
              <Compass className="w-3.5 h-3.5 text-blue-600" />
              <span>
                Agency: <strong>Northstar Studio</strong> (US)
              </span>
            </div>

            <button
              onClick={() => setActiveTab('intake')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">New Lead Intake</span>
              <span className="sm:hidden">Intake</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex gap-2 sm:gap-6 border-t border-slate-100 overflow-x-auto">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`py-3 px-2 sm:px-0 text-xs font-bold border-b-2 transition flex items-center gap-2 shrink-0 ${
              activeTab === 'dashboard'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Overview &amp; Priorities
          </button>

          <button
            onClick={() => setActiveTab('leads')}
            className={`py-3 px-2 sm:px-0 text-xs font-bold border-b-2 transition flex items-center gap-2 shrink-0 ${
              activeTab === 'leads'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Inbox className="w-4 h-4" />
            Leads Inbox
          </button>

          <button
            onClick={() => setActiveTab('drafts')}
            className={`py-3 px-2 sm:px-0 text-xs font-bold border-b-2 transition flex items-center gap-2 shrink-0 ${
              activeTab === 'drafts'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Mail className="w-4 h-4" />
            Drafts &amp; Approvals
          </button>

          <button
            onClick={() => setActiveTab('intake')}
            className={`py-3 px-2 sm:px-0 text-xs font-bold border-b-2 transition flex items-center gap-2 shrink-0 ${
              activeTab === 'intake'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            Intake (Form &amp; Paste Email)
          </button>
        </div>
      </header>

      {/* Interactive Main Body */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <LeadDashboard onNavigateToIntake={() => setActiveTab('intake')} />
          </div>
        )}

        {activeTab === 'leads' && (
          <div className="space-y-6">
            <LeadDashboard onNavigateToIntake={() => setActiveTab('intake')} />
          </div>
        )}

        {activeTab === 'drafts' && (
          <div className="space-y-6">
            <DraftsManager />
          </div>
        )}

        {activeTab === 'intake' && (
          <div className="space-y-6">
            <div className="text-center max-w-2xl mx-auto space-y-1 mb-6">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Inbound Lead Intake &amp; Qualification
              </h1>
              <p className="text-xs text-slate-500">
                Submit through the structured form or paste unformatted client emails for instant Gemini signal extraction.
              </p>
            </div>
            <LeadForm />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
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
          <p className="text-[11px] text-slate-400 text-center sm:text-left leading-relaxed">
            LeadFlow uses AI for lead analysis and message drafting. Business-state decisions such as scoring, priority, follow-up timing, and response status are handled deterministically or by human input.
          </p>
        </div>
      </footer>
    </div>
  );
}

