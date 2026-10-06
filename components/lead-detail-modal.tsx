'use client';

import React, { useState, useEffect } from 'react';
import { Lead, ScoringFactor } from '@/types/lead';
import { reconstructFactorsFromLead } from '@/lib/scoring';
import { EmailDraftCard } from './email-draft-card';
import {
  X,
  DollarSign,
  Clock,
  Briefcase,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  FileText,
  Send,
  Zap,
  Layers,
} from 'lucide-react';

interface LeadDetailModalProps {
  leadId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onLeadUpdated?: () => void;
}

export function LeadDetailModal({
  leadId,
  isOpen,
  onClose,
  onLeadUpdated,
}: LeadDetailModalProps) {
  const [lead, setLead] = useState<Lead | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'score_breakdown' | 'email_draft'>('overview');

  const handleClose = () => {
    onLeadUpdated?.();
    onClose();
  };

  useEffect(() => {
    if (!isOpen || !leadId) {
      setLead(null);
      return;
    }

    let isMounted = true;
    async function fetchLeadDetails() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/leads/${leadId}`);
        if (!res.ok) {
          throw new Error('Failed to load lead details');
        }
        const data = await res.json();
        if (isMounted) {
          setLead(data.lead);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Error loading lead');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchLeadDetails();
    return () => {
      isMounted = false;
    };
  }, [isOpen, leadId]);

  if (!isOpen) return null;

  const factors: ScoringFactor[] = lead ? reconstructFactorsFromLead(lead) : [];

  const tierConfig = {
    HIGH: {
      badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      badgeDot: 'bg-emerald-500',
      label: 'High Priority Prospect',
      scoreColor: 'text-emerald-700',
      barColor: 'from-emerald-500 to-teal-500',
    },
    MEDIUM: {
      badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
      badgeDot: 'bg-amber-500',
      label: 'Moderate Potential',
      scoreColor: 'text-amber-700',
      barColor: 'from-amber-500 to-orange-500',
    },
    LOW: {
      badgeBg: 'bg-slate-100 text-slate-700 border-slate-200',
      badgeDot: 'bg-slate-400',
      label: 'Low / Exploratory',
      scoreColor: 'text-slate-700',
      barColor: 'from-slate-400 to-slate-500',
    },
  }[lead?.qualification || 'LOW'];

  const formattedBudget = lead?.budget
    ? `$${lead.budget.toLocaleString('en-US')} ${lead.currency || 'USD'}`
    : 'Not provided';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-sm">
              <Sparkles className="w-5 h-5 text-blue-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">
                  {lead?.name || 'Lead Details'}
                </h2>
                {lead?.source && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-full">
                    Source: {lead.source}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {lead?.company ? `${lead.company} • ` : ''}
                {lead?.email}
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="px-6 border-b border-slate-200 flex gap-6 bg-white">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3.5 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            Overview & AI Analysis
          </button>
          <button
            onClick={() => setActiveTab('score_breakdown')}
            className={`py-3.5 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'score_breakdown'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Score Breakdown (7 Factors)
          </button>
          <button
            onClick={() => setActiveTab('email_draft')}
            className={`py-3.5 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'email_draft'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Send className="w-4 h-4" />
            Email Draft & Approval
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/40">
          {isLoading ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-500 font-medium">Loading lead intelligence...</p>
            </div>
          ) : error ? (
            <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-center space-y-2">
              <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
              <p className="text-sm font-semibold text-rose-900">{error}</p>
            </div>
          ) : lead ? (
            <>
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Top Score Banner */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${tierConfig.badgeBg}`}
                        >
                          <span className={`w-2 h-2 rounded-full ${tierConfig.badgeDot}`} />
                          {tierConfig.label}
                        </span>
                        <span className="text-xs text-slate-400">
                          Status: <strong className="text-slate-700">{lead.status}</strong>
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">
                        {lead.ai_summary || 'Inquiry analyzed by Northstar Studio Lead Qualification Engine.'}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 sm:border-l sm:border-slate-200 sm:pl-6">
                      <div className="text-right">
                        <div className="text-[10px] uppercase font-bold text-slate-400">Score</div>
                        <div className={`text-2xl font-black ${tierConfig.scoreColor}`}>
                          {lead.ai_score ?? '—'}/100
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Grid of Key Metadata */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        <Briefcase className="w-3.5 h-3.5 text-blue-500" /> Service
                      </div>
                      <div className="text-xs font-bold text-slate-800 truncate">
                        {lead.service || 'Not specified'}
                      </div>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-500" /> Budget
                      </div>
                      <div className="text-xs font-bold text-slate-800 truncate">
                        {formattedBudget}
                      </div>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        <Clock className="w-3.5 h-3.5 text-amber-500" /> Timeline
                      </div>
                      <div className="text-xs font-bold text-slate-800 truncate">
                        {lead.timeline || 'Flexible'}
                      </div>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        <Zap className="w-3.5 h-3.5 text-indigo-500" /> Intent / Urgency
                      </div>
                      <div className="text-xs font-bold text-slate-800 truncate">
                        {lead.intent || 'Medium'} • {lead.urgency || 'Medium'}
                      </div>
                    </div>
                  </div>

                  {/* AI Reasoning & Strategy */}
                  {lead.ai_reasoning && (
                    <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" /> AI Strategic Assessment
                      </h4>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        {lead.ai_reasoning}
                      </p>
                    </div>
                  )}

                  {/* Missing Info & Recommended Action */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    {lead.missing_information && lead.missing_information.length > 0 && (
                      <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4 space-y-2">
                        <h4 className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> Missing Information to Quote
                        </h4>
                        <ul className="text-xs text-amber-800 space-y-1 list-disc list-inside">
                          {lead.missing_information.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {lead.recommended_action && (
                      <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-4 space-y-2">
                        <h4 className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                          <ArrowRight className="w-3.5 h-3.5 text-blue-600" /> Recommended Action
                        </h4>
                        <p className="text-xs text-blue-800 leading-relaxed font-medium">
                          {lead.recommended_action}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Original Inquiry Message */}
                  <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-slate-400" /> Original Inquiry Message
                    </h4>
                    <div className="text-xs text-slate-700 whitespace-pre-wrap bg-slate-50 p-3.5 rounded-lg border border-slate-200/80 leading-relaxed">
                      {lead.message}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: SCORE BREAKDOWN (7 FACTORS) */}
              {activeTab === 'score_breakdown' && (
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Deterministic Scoring Formula</h3>
                      <p className="text-xs text-slate-500">
                        Objective scoring factors with zero hallucination. Maximum possible score is 100.
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-black text-blue-600">
                        {lead.ai_score ?? 0}
                      </span>
                      <span className="text-xs text-slate-400 font-bold"> / 100</span>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {factors.map((factor, index) => (
                      <div
                        key={index}
                        className={`p-3.5 rounded-xl border transition flex items-start justify-between gap-3 ${
                          factor.met
                            ? 'bg-emerald-50/50 border-emerald-200/80'
                            : 'bg-slate-50/80 border-slate-200 text-slate-400'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <div className="mt-0.5">
                            {factor.met ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            ) : (
                              <XCircle className="w-4 h-4 text-slate-400 shrink-0" />
                            )}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-800">
                              {factor.name}
                            </div>
                            <div className="text-[11px] text-slate-600 mt-0.5">
                              {factor.description}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span
                            className={`text-xs font-black ${
                              factor.met ? 'text-emerald-700' : 'text-slate-400'
                            }`}
                          >
                            +{factor.points}
                          </span>
                          <span className="text-[10px] text-slate-400 block font-medium">
                            / {factor.maxPoints} pts
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: EMAIL DRAFT & APPROVAL */}
              {activeTab === 'email_draft' && (
                <div className="space-y-4">
                  <EmailDraftCard leadId={lead.id} lead={lead} />
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Lead ID: <code className="text-slate-600 font-mono">{lead?.id?.slice(0, 8)}...</code>
          </span>
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
