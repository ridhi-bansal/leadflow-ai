'use client';

import React, { useEffect, useState } from 'react';
import { Sparkles, Bot, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';

const STEPS = [
  { icon: ShieldCheck, text: 'Validating inquiry & saving to Supabase database...' },
  { icon: Bot, text: 'Extracting intent, budget & scope via Gemini AI...' },
  { icon: Zap, text: 'Evaluating agency budget heuristics & timeline...' },
  { icon: Sparkles, text: 'Computing deterministic qualification score...' },
];

export function LoadingState({ leadName }: { leadName?: string }) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => (prev < STEPS.length - 1 ? prev + 1 : prev));
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm text-center max-w-xl mx-auto my-8">
      <div className="relative w-16 h-16 mx-auto mb-6 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-blue-100 animate-ping opacity-60" />
        <div className="relative w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white shadow-md">
          <Sparkles className="w-7 h-7 animate-pulse" />
        </div>
      </div>

      <h3 className="text-xl font-semibold text-slate-900 mb-1">
        Analyzing Lead with Gemini AI
      </h3>
      <p className="text-sm text-slate-500 mb-6">
        {leadName ? `Evaluating inquiry from ${leadName}` : 'Evaluating inquiry signals for Northstar Studio...'}
      </p>

      <div className="space-y-3 text-left bg-slate-50 p-4 rounded-xl border border-slate-100">
        {STEPS.map((step, idx) => {
          const StepIcon = step.icon;
          const isDone = idx < currentStepIndex;
          const isCurrent = idx === currentStepIndex;

          return (
            <div
              key={idx}
              className={`flex items-center gap-3 transition-opacity duration-300 ${
                isCurrent
                  ? 'text-blue-700 font-medium'
                  : isDone
                  ? 'text-emerald-700'
                  : 'text-slate-400 opacity-60'
              }`}
            >
              {isDone ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : isCurrent ? (
                <StepIcon className="w-5 h-5 text-blue-600 animate-spin shrink-0" />
              ) : (
                <div className="w-5 h-5 rounded-full border border-slate-300 flex items-center justify-center text-[10px] text-slate-400 shrink-0">
                  {idx + 1}
                </div>
              )}
              <span className="text-sm">{step.text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
