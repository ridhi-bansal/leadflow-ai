'use client';

import React, { useState } from 'react';
import {
  Lead,
  QualificationResult as QualificationResultType,
} from '@/types/lead';
import { EmailDraftCard } from './email-draft-card';
import {
  CheckCircle2,
  XCircle,
  Sparkles,
  TrendingUp,
  Clock,
  DollarSign,
  Briefcase,
  AlertCircle,
  ArrowRight,
  Code2,
  RefreshCw,
  Zap,
  Building2,
  Mail,
} from 'lucide-react';

interface QualificationResultProps {
  result: QualificationResultType;
  lead?: Lead | null;
  onReset: () => void;
}

export function QualificationResult({
  result,
  lead,
  onReset,
}: QualificationResultProps) {
  const [showRawJson, setShowRawJson] = useState(false);
  const { score, qualification, factors, analysis } = result;

  // Visual style by qualification tier
  const tierConfig = {
    HIGH: {
      badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      badgeDot: 'bg-emerald-500',
      progressColor: 'from-emerald-500 to-teal-500',
      label: 'High Priority Prospect',
      scoreText: 'text-emerald-700',
    },
    MEDIUM: {
      badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
      badgeDot: 'bg-amber-500',
      progressColor: 'from-amber-500 to-orange-500',
      label: 'Moderate Potential',
      scoreText: 'text-amber-700',
    },
    LOW: {
      badgeBg: 'bg-slate-100 text-slate-700 border-slate-200',
      badgeDot: 'bg-slate-400',
      progressColor: 'from-slate-400 to-slate-500',
      label: 'Low / Exploratory',
      scoreText: 'text-slate-700',
    },
  }[qualification];

  const formattedBudget = analysis.budget
    ? `$${analysis.budget.toLocaleString('en-US')} ${analysis.currency || 'USD'}`
    : lead?.budget
    ? `$${lead.budget.toLocaleString('en-US')} ${lead.currency || 'USD'}`
    : 'Not provided';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Banner & Header */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 sm:p-8 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-md text-white border border-white/15">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  AI Qualification Complete
                </span>
                <span className="text-xs text-slate-400">Northstar Studio Lead Analyst</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                {lead?.name || 'Inquiry Analysis'}
              </h2>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-300">
                {lead?.company && (
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    {lead.company}
                  </span>
                )}
                {lead?.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    {lead.email}
                  </span>
                )}
              </div>
            </div>

            {/* Score Ring / Card */}
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 sm:p-5 flex items-center gap-4 shrink-0">
              <div className="text-right">
                <div className="text-xs uppercase tracking-wider text-slate-300 font-medium">
                  Qualification Score
                </div>
                <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white flex items-baseline justify-end gap-1">
                  <span>{score}</span>
                  <span className="text-sm font-normal text-slate-400">/ 100</span>
                </div>
              </div>
              <div
                className={`px-3.5 py-2 rounded-xl text-xs font-bold border uppercase tracking-wider ${tierConfig.badgeBg}`}
              >
                {qualification}
              </div>
            </div>
          </div>
        </div>

        {/* Key Signals Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 divide-x divide-y sm:divide-y-0 divide-slate-100 bg-slate-50/50 border-b border-slate-200 text-xs">
          <div className="p-4">
            <span className="text-slate-500 block font-medium mb-1 flex items-center gap-1">
              <Briefcase className="w-3.5 h-3.5 text-slate-400" /> Service
            </span>
            <span className="font-semibold text-slate-900 text-sm">
              {analysis.service || lead?.service || 'Unspecified'}
            </span>
          </div>

          <div className="p-4">
            <span className="text-slate-500 block font-medium mb-1 flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-slate-400" /> Budget
            </span>
            <span className="font-semibold text-slate-900 text-sm">{formattedBudget}</span>
          </div>

          <div className="p-4">
            <span className="text-slate-500 block font-medium mb-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" /> Timeline
            </span>
            <span className="font-semibold text-slate-900 text-sm">
              {analysis.timeline || lead?.timeline || 'Flexible'}
            </span>
          </div>

          <div className="p-4">
            <span className="text-slate-500 block font-medium mb-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-slate-400" /> Intent
            </span>
            <span className="font-semibold text-slate-900 text-sm capitalize">
              {analysis.intent}
            </span>
          </div>

          <div className="p-4 col-span-2 sm:col-span-1">
            <span className="text-slate-500 block font-medium mb-1 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-slate-400" /> Urgency
            </span>
            <span className="font-semibold text-slate-900 text-sm capitalize">
              {analysis.urgency}
            </span>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {/* AI Executive Summary */}
          <div>
            <h3 className="text-xs uppercase tracking-wider font-bold text-slate-500 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              Executive AI Summary
            </h3>
            <p className="text-slate-800 text-base leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
              {analysis.summary}
            </p>
          </div>

          {/* Recommended Action Callout */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-5 flex items-start gap-4">
            <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
              <ArrowRight className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs uppercase tracking-wider font-bold text-blue-900 block mb-0.5">
                Recommended Next Action
              </span>
              <p className="text-sm font-semibold text-blue-950">
                {analysis.recommended_action}
              </p>
            </div>
          </div>

          {/* Explainable Scoring Factors */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs uppercase tracking-wider font-bold text-slate-500 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                Deterministic Scoring Breakdown ({score}/100)
              </h3>
              <span className="text-xs text-slate-500">Calculated by Northstar Heuristic Rules</span>
            </div>

            <div className="space-y-2">
              {factors.map((factor, index) => (
                <div
                  key={index}
                  className={`flex items-start justify-between p-3.5 rounded-xl border transition-colors ${
                    factor.met
                      ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {factor.met ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="font-semibold text-sm flex items-center gap-2">
                        <span>{factor.name}</span>
                        {factor.met && (
                          <span className="text-xs font-mono font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                            +{factor.points} pts
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{factor.description}</p>
                    </div>
                  </div>
                  <div className="text-xs font-mono font-medium text-slate-400 shrink-0">
                    max {factor.maxPoints}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Specific Requirements & Missing Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            {/* Specific Requirements */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Identified Scope & Requirements
              </h4>
              {analysis.specific_requirements && analysis.specific_requirements.length > 0 ? (
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {analysis.specific_requirements.map((req, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-500 italic">No specific technical requirements identified.</p>
              )}
            </div>

            {/* Missing Information */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                Missing Information / Clarifications Needed
              </h4>
              {analysis.missing_information && analysis.missing_information.length > 0 ? (
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {analysis.missing_information.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-500 italic">All essential qualification details provided.</p>
              )}
            </div>
          </div>

          {/* Reasoning */}
          {analysis.reasoning && (
            <div className="text-xs text-slate-600 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200">
              <span className="font-semibold text-slate-700 block mb-1">Analyst Reasoning Note:</span>
              <p className="leading-relaxed">{analysis.reasoning}</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-6 sm:px-8 py-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <button
            onClick={() => setShowRawJson(!showRawJson)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <Code2 className="w-4 h-4" />
            {showRawJson ? 'Hide Raw JSON' : 'Inspect Raw AI Output'}
          </button>

          <button
            onClick={onReset}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-medium transition-colors shadow-sm cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Submit Another Lead
          </button>
        </div>

        {/* Raw JSON viewer */}
        {showRawJson && (
          <div className="p-6 bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto border-t border-slate-800">
            <pre>{JSON.stringify({ lead, qualificationResult: result }, null, 2)}</pre>
          </div>
        )}
      </div>

      {/* Milestone 2: AI Email Draft & Human Approval */}
      {lead?.id && (
        <EmailDraftCard leadId={lead.id} lead={lead} />
      )}
    </div>
  );
}
