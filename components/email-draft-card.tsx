'use client';

import React, { useState, useEffect } from 'react';
import { Communication, Lead } from '@/types/lead';
import {
  Sparkles,
  CheckCircle2,
  Edit3,
  RotateCcw,
  Save,
  Check,
  UserCheck,
  AlertCircle,
  FileText,
  Clock,
} from 'lucide-react';

interface EmailDraftCardProps {
  leadId: string;
  lead?: Lead | null;
}

export function EmailDraftCard({ leadId, lead }: EmailDraftCardProps) {
  const [communication, setCommunication] = useState<Communication | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isApproving, setIsApproving] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Editable fields
  const [subject, setSubject] = useState<string>('');
  const [body, setBody] = useState<string>('');

  // 1. Fetch or generate initial draft on mount
  useEffect(() => {
    let isMounted = true;

    async function loadOrCreateDraft() {
      setIsLoading(true);
      setError(null);
      try {
        // First check if draft already exists
        const res = await fetch(`/api/leads/${leadId}/draft`);
        const data = await res.json();

        if (data.communication && isMounted) {
          setCommunication(data.communication);
          setSubject(data.communication.subject);
          setBody(data.communication.body);
          setIsLoading(false);
          return;
        }

        // If no draft exists, generate one automatically
        const generateRes = await fetch(`/api/leads/${leadId}/draft`, {
          method: 'POST',
        });
        const generateData = await generateRes.json();

        if (generateData.communication && isMounted) {
          setCommunication(generateData.communication);
          setSubject(generateData.communication.subject);
          setBody(generateData.communication.body);
        } else if (generateData.error && isMounted) {
          setError(generateData.error);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to load/generate draft:', err);
          setError('Failed to initialize AI email draft. You can try generating below.');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadOrCreateDraft();

    return () => {
      isMounted = false;
    };
  }, [leadId]);

  // Regenerate draft
  const handleRegenerate = async (force: boolean = false) => {
    setIsGenerating(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch(`/api/leads/${leadId}/draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force }),
      });
      const data = await res.json();

      if (!res.ok || !data.communication) {
        throw new Error(data.error || 'Failed to generate email draft.');
      }

      setCommunication(data.communication);
      setSubject(data.communication.subject);
      setBody(data.communication.body);
      setIsEditing(false);
      setSuccessMessage('AI generated a fresh personalized draft.');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      console.error('Regeneration error:', err);
      setError(err instanceof Error ? err.message : 'Error generating draft.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Save manual edits
  const handleSaveEdits = async () => {
    if (!communication) return;
    if (!subject.trim() || !body.trim()) {
      setError('Subject and body cannot be empty.');
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch(`/api/communications/${communication.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, body }),
      });
      const data = await res.json();

      if (!res.ok || !data.communication) {
        throw new Error(data.error || 'Failed to save draft edits.');
      }

      setCommunication(data.communication);
      setIsEditing(false);
      setSuccessMessage('Draft edits saved successfully.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Save error:', err);
      setError(err instanceof Error ? err.message : 'Error saving edits.');
    } finally {
      setIsSaving(false);
    }
  };

  // Approve email
  const handleApprove = async () => {
    if (!communication) return;

    setIsApproving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch(`/api/communications/${communication.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, body }),
      });
      const data = await res.json();

      if (!res.ok || !data.communication) {
        throw new Error(data.error || 'Failed to approve email draft.');
      }

      setCommunication(data.communication);
      setIsEditing(false);
      setSuccessMessage('Email draft approved! Stored in database as ready for sending.');
    } catch (err) {
      console.error('Approval error:', err);
      setError(err instanceof Error ? err.message : 'Error approving email.');
    } finally {
      setIsApproving(false);
    }
  };

  const isApproved = communication?.status === 'APPROVED';

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden transition-all">
      {/* Header Bar */}
      <div
        className={`p-5 sm:p-6 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
          isApproved
            ? 'bg-emerald-50/70 border-emerald-200'
            : 'bg-gradient-to-r from-slate-50 to-indigo-50/40 border-slate-200'
        }`}
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
                isApproved
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : 'bg-amber-100 text-amber-800 border-amber-300'
              }`}
            >
              {isApproved ? (
                <>
                  <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
                  Human Approved
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                  AI Generated Draft • Awaiting Review
                </>
              )}
            </span>
            <span className="text-xs text-slate-500 hidden sm:inline">
              Personalized Agency Reply
            </span>
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            {isApproved ? 'Approved Email Response' : 'Proposed Email Response Draft'}
          </h3>
        </div>

        {/* Action button controls */}
        <div className="flex flex-wrap items-center gap-2">
          {!isApproved && (
            <>
              <button
                type="button"
                onClick={() => handleRegenerate(false)}
                disabled={isGenerating || isLoading || isSaving || isApproving}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                {isGenerating ? 'Generating...' : 'Regenerate Draft'}
              </button>

              {!isEditing ? (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  disabled={!communication || isLoading || isGenerating}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                  Edit Draft
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSaveEdits}
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-sm"
                >
                  <Save className={`w-3.5 h-3.5 ${isSaving ? 'animate-spin' : ''}`} />
                  {isSaving ? 'Saving...' : 'Save Edits'}
                </button>
              )}

              <button
                type="button"
                onClick={handleApprove}
                disabled={!communication || isApproving || isLoading || isGenerating}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm disabled:opacity-50 cursor-pointer"
              >
                <Check className={`w-3.5 h-3.5 ${isApproving ? 'animate-spin' : ''}`} />
                {isApproving ? 'Approving...' : 'Approve Email'}
              </button>
            </>
          )}

          {isApproved && (
            <button
              type="button"
              onClick={() => handleRegenerate(true)}
              disabled={isGenerating}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-medium transition-colors cursor-pointer"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              {isGenerating ? 'Generating New...' : 'Create New Draft'}
            </button>
          )}
        </div>
      </div>

      {/* Notifications / Alerts */}
      {error && (
        <div className="bg-rose-50 border-b border-rose-200 p-4 text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="bg-emerald-50 border-b border-emerald-200 p-4 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="p-8 text-center space-y-3">
          <div className="w-8 h-8 mx-auto border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-600">
            Generating personalized reply draft with Gemini...
          </p>
          <p className="text-xs text-slate-400">
            Referencing {lead?.name || 'prospect'} &apos;s scope and timeline
          </p>
        </div>
      ) : (
        <div className="p-6 sm:p-8 space-y-5">
          {/* Metadata Bar */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-600 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <span className="font-semibold text-slate-700">To: </span>
              <span>{lead?.name || 'Prospect'} &lt;{lead?.email || 'email@example.com'}&gt;</span>
            </div>
            <div>
              <span className="font-semibold text-slate-700">From: </span>
              <span>Northstar Studio Team &lt;hello@northstarstudio.com&gt;</span>
            </div>
          </div>

          {/* Subject Field */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Subject Line
            </label>
            {isEditing && !isApproved ? (
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm font-semibold text-slate-900 bg-white transition-all focus:outline-none"
              />
            ) : (
              <div className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900">
                {subject || 'No subject line'}
              </div>
            )}
          </div>

          {/* Body Field */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center justify-between">
              <span>Email Body</span>
              {isEditing && !isApproved && (
                <span className="text-[11px] font-normal text-blue-600">Editing draft...</span>
              )}
            </label>
            {isEditing && !isApproved ? (
              <textarea
                rows={9}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm font-sans text-slate-900 bg-white transition-all focus:outline-none leading-relaxed resize-y"
              />
            ) : (
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 leading-relaxed whitespace-pre-line font-sans">
                {body || 'No email body generated.'}
              </div>
            )}
          </div>

          {/* Bottom Status Info */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>
                Status: <strong>{communication?.status || 'DRAFT'}</strong>
              </span>
              {communication?.approved_at && (
                <span className="flex items-center gap-1 text-emerald-700 font-medium">
                  <Clock className="w-3 h-3 text-emerald-600" />
                  Approved on {new Date(communication.approved_at).toLocaleString('en-US')}
                </span>
              )}
            </div>

            <div className="text-[11px] text-slate-400 italic">
              Milestone 2: Ready for approval. No emails will be sent until future milestones.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
