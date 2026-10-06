'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Communication, FollowUpRecommendation, Lead, ResponseStatus, ScoringFactor } from '@/types/lead';
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
  History,
  Calendar,
  MessageSquare,
  Check,
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
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [recommendation, setRecommendation] = useState<FollowUpRecommendation | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isUpdatingResponse, setIsUpdatingResponse] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'score_breakdown' | 'email_draft' | 'follow_ups'>('overview');
  const [activeFollowUpDraft, setActiveFollowUpDraft] = useState<number | null>(null);

  const fetchLeadDetails = useCallback(async () => {
    if (!leadId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/leads/${leadId}`);
      if (!res.ok) {
        throw new Error('Failed to load lead details');
      }
      const data = await res.json();
      setLead(data.lead);
      setCommunications(data.communications || []);
      setRecommendation(data.recommendation || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading lead');
    } finally {
      setIsLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    if (isOpen && leadId) {
      fetchLeadDetails();
    } else {
      setLead(null);
      setCommunications([]);
      setRecommendation(null);
      setActiveFollowUpDraft(null);
    }
  }, [isOpen, leadId, fetchLeadDetails]);

  const handleClose = () => {
    onLeadUpdated?.();
    onClose();
  };

  const handleUpdateResponseStatus = async (newStatus: ResponseStatus) => {
    if (!leadId) return;
    setIsUpdatingResponse(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/response`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response_status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update response status');
      }
      setLead(data.lead);
      setRecommendation(data.recommendation);
      onLeadUpdated?.();
    } catch (err) {
      console.error('Failed to update response status:', err);
      setError(err instanceof Error ? err.message : 'Error updating response status');
    } finally {
      setIsUpdatingResponse(false);
    }
  };

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

  const currentResponseStatus = lead?.response_status || 'waiting';

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
                <span
                  className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                    currentResponseStatus === 'replied'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : currentResponseStatus === 'no_response'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}
                >
                  {currentResponseStatus === 'replied'
                    ? '✓ Replied'
                    : currentResponseStatus === 'no_response'
                    ? 'No Response'
                    : 'Waiting for Response'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {lead?.company ? `${lead.company} • ` : ''}
                {lead?.email}
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="px-6 border-b border-slate-200 flex gap-4 sm:gap-6 bg-white overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3.5 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            Overview &amp; AI Analysis
          </button>

          <button
            onClick={() => setActiveTab('score_breakdown')}
            className={`py-3.5 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'score_breakdown'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Score Breakdown
          </button>

          <button
            onClick={() => setActiveTab('email_draft')}
            className={`py-3.5 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'email_draft'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Send className="w-4 h-4" />
            Initial Email Draft
          </button>

          <button
            onClick={() => setActiveTab('follow_ups')}
            className={`py-3.5 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 shrink-0 cursor-pointer relative ${
              activeTab === 'follow_ups'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Follow-Up Intelligence</span>
            {recommendation?.shouldFollowUp && (
              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block ml-0.5" />
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/40">
          {error && lead && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start justify-between gap-3 text-rose-900 text-xs">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Error updating response status</div>
                  <p className="text-rose-800 mt-0.5">{error}</p>
                </div>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-rose-500 hover:text-rose-800 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {isLoading ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-500 font-medium">Loading lead intelligence...</p>
            </div>
          ) : !lead && error ? (
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
                    <div className="text-xs text-slate-700 whitespace-pre-wrap bg-slate-50 p-3.5 rounded-lg border border-slate-200/80 leading-relaxed font-mono text-[11px]">
                      {lead.message}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: SCORE BREAKDOWN */}
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

              {/* TAB 3: INITIAL EMAIL DRAFT */}
              {activeTab === 'email_draft' && (
                <div className="space-y-4">
                  <EmailDraftCard
                    leadId={lead.id}
                    lead={lead}
                    communicationType="initial_reply"
                    onDraftUpdated={fetchLeadDetails}
                  />
                </div>
              )}

              {/* TAB 4: FOLLOW-UP INTELLIGENCE & TIMELINE */}
              {activeTab === 'follow_ups' && (
                <div className="space-y-6">
                  {/* 1. Manual Response Tracking Controls */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-blue-600" />
                          Manual Response Tracking
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Tell LeadFlow what happened after outreach. Response tracking is explicit and user-directed.
                        </p>
                      </div>

                      {/* Status Badges & Switchers */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleUpdateResponseStatus('waiting')}
                          disabled={isUpdatingResponse || currentResponseStatus === 'waiting'}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition border cursor-pointer ${
                            currentResponseStatus === 'waiting'
                              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                              : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          Waiting for Response
                        </button>

                        <button
                          type="button"
                          onClick={() => handleUpdateResponseStatus('replied')}
                          disabled={isUpdatingResponse || currentResponseStatus === 'replied'}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition border cursor-pointer ${
                            currentResponseStatus === 'replied'
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5 inline mr-1" />
                          Mark as Replied
                        </button>

                        <button
                          type="button"
                          onClick={() => handleUpdateResponseStatus('no_response')}
                          disabled={isUpdatingResponse || currentResponseStatus === 'no_response'}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition border cursor-pointer ${
                            currentResponseStatus === 'no_response'
                              ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                              : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                          }`}
                        >
                          Mark as No Response
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 2. Operational Recommendation Card */}
                  <div
                    className={`p-5 rounded-2xl border transition shadow-sm ${
                      currentResponseStatus === 'replied'
                        ? 'bg-emerald-50/80 border-emerald-200'
                        : recommendation?.status === 'STOPPED_MAX'
                        ? 'bg-slate-100 border-slate-200 text-slate-700'
                        : recommendation?.shouldFollowUp
                        ? 'bg-gradient-to-r from-blue-50 via-indigo-50 to-white border-blue-200'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                              currentResponseStatus === 'replied'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : recommendation?.status === 'STOPPED_MAX'
                                ? 'bg-slate-200 text-slate-700 border-slate-300'
                                : recommendation?.isDue
                                ? 'bg-rose-100 text-rose-800 border-rose-300'
                                : 'bg-blue-100 text-blue-800 border-blue-300'
                            }`}
                          >
                            {currentResponseStatus === 'replied'
                              ? '✓ Follow-ups Paused'
                              : recommendation?.status === 'STOPPED_MAX'
                              ? 'Sequence Complete'
                              : recommendation?.isDue
                              ? 'Follow-Up Due Today'
                              : `Follow-Up #${recommendation?.followUpNumber || 1} Recommended`}
                          </span>

                          {recommendation?.recommendedDateFormatted && (
                            <span className="text-xs text-slate-500 font-medium">
                              Target Date: <strong>{recommendation.recommendedDateFormatted}</strong>
                            </span>
                          )}
                        </div>

                        <h4 className="text-sm font-bold text-slate-900">
                          {recommendation?.reason || 'Response intelligence evaluated.'}
                        </h4>

                        <p className="text-xs text-slate-600 leading-relaxed">
                          <strong>Next Action:</strong> {recommendation?.nextAction}
                        </p>
                      </div>

                      {/* Action to trigger follow-up draft */}
                      {recommendation?.shouldFollowUp && recommendation.followUpNumber && (
                        <button
                          type="button"
                          onClick={() => setActiveFollowUpDraft(recommendation.followUpNumber)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm shrink-0 cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Generate Follow-Up #{recommendation.followUpNumber} Draft</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 3. Follow-Up Email Draft Card (if requested or active) */}
                  {activeFollowUpDraft && (
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Follow-Up #{activeFollowUpDraft} Draft Composer
                        </h4>
                        <button
                          onClick={() => setActiveFollowUpDraft(null)}
                          className="text-xs text-slate-400 hover:text-slate-600"
                        >
                          Collapse Draft
                        </button>
                      </div>

                      <EmailDraftCard
                        leadId={lead.id}
                        lead={lead}
                        communicationType={
                          activeFollowUpDraft === 2 ? 'follow_up_2' : 'follow_up_1'
                        }
                        followUpNumber={activeFollowUpDraft}
                        onDraftUpdated={fetchLeadDetails}
                      />
                    </div>
                  )}

                  {/* 4. Lead Activity & Response Timeline */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <History className="w-3.5 h-3.5 text-slate-400" />
                      Lead Activity Timeline
                    </h4>

                    <div className="relative pl-6 space-y-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                      {/* Event 1: Lead Received */}
                      <div className="relative">
                        <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-sm flex items-center justify-center" />
                        <div className="text-xs font-bold text-slate-900">Lead Received</div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {lead.name} submitted an inquiry via {lead.source || 'form'}.
                        </p>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {new Date(lead.created_at).toLocaleString('en-US')}
                        </span>
                      </div>

                      {/* Event 2: AI Analyzed */}
                      {lead.ai_score !== null && (
                        <div className="relative">
                          <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-indigo-600 border-2 border-white shadow-sm" />
                          <div className="text-xs font-bold text-slate-900">AI Qualification Analysis</div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Scored <strong>{lead.ai_score}/100</strong> • Tier: <strong>{lead.qualification}</strong> ({lead.intent || 'Medium'} intent)
                          </p>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            {new Date(lead.created_at).toLocaleString('en-US')}
                          </span>
                        </div>
                      )}

                      {/* Event 3: Communications */}
                      {communications.map((c) => (
                        <div key={c.id} className="relative">
                          <div
                            className={`absolute -left-6 top-0.5 w-4 h-4 rounded-full border-2 border-white shadow-sm ${
                              c.status === 'APPROVED' || c.status === 'SENT'
                                ? 'bg-emerald-600'
                                : 'bg-amber-500'
                            }`}
                          />
                          <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <span>
                              {c.type === 'initial_reply'
                                ? 'Initial Outreach Email'
                                : c.type === 'follow_up_1'
                                ? 'Follow-Up #1'
                                : 'Follow-Up #2'}
                            </span>
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                                c.status === 'APPROVED'
                                  ? 'bg-blue-100 text-blue-800'
                                  : c.status === 'SENT'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {c.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                            Subject: {c.subject}
                          </p>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            {c.approved_at
                              ? `Approved on ${new Date(c.approved_at).toLocaleString('en-US')}`
                              : `Created on ${new Date(c.created_at).toLocaleString('en-US')}`}
                          </span>
                        </div>
                      ))}

                      {/* Event 4: Current Response State */}
                      <div className="relative">
                        <div
                          className={`absolute -left-6 top-0.5 w-4 h-4 rounded-full border-2 border-white shadow-sm ${
                            currentResponseStatus === 'replied'
                              ? 'bg-emerald-500'
                              : currentResponseStatus === 'no_response'
                              ? 'bg-amber-500'
                              : 'bg-blue-400'
                          }`}
                        />
                        <div className="text-xs font-bold text-slate-900">
                          Response Status: {currentResponseStatus.toUpperCase().replace('_', ' ')}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {currentResponseStatus === 'replied'
                            ? 'Lead marked as REPLIED. Automated follow-ups paused.'
                            : currentResponseStatus === 'no_response'
                            ? 'No response recorded from prospect.'
                            : 'Awaiting prospect response.'}
                        </p>
                      </div>
                    </div>
                  </div>
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
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
