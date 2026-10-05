'use client';

import React from 'react';
import { AlertTriangle, RotateCcw, ArrowLeft } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message: string;
  leadId?: string | null;
  onRetry?: () => void;
  onReset?: () => void;
  isRetrying?: boolean;
}

export function ErrorState({
  title = 'Analysis Notice',
  message,
  leadId,
  onRetry,
  onReset,
  isRetrying = false,
}: ErrorStateProps) {
  return (
    <div className="bg-white border border-rose-200 rounded-2xl p-8 shadow-sm max-w-xl mx-auto my-8 text-center">
      <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-100">
        <AlertTriangle className="w-7 h-7" />
      </div>

      <h3 className="text-xl font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-sm text-slate-600 mb-6 leading-relaxed">{message}</p>

      {leadId && (
        <div className="inline-block bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-mono text-slate-600 mb-6">
          Lead Record ID: {leadId}
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        {onRetry && (
          <button
            onClick={onRetry}
            disabled={isRetrying}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl font-medium text-sm transition-colors shadow-sm cursor-pointer"
          >
            <RotateCcw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
            {isRetrying ? 'Retrying Analysis...' : 'Retry AI Analysis'}
          </button>
        )}

        {onReset && (
          <button
            onClick={onReset}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium text-sm transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Submit New Lead
          </button>
        )}
      </div>
    </div>
  );
}
