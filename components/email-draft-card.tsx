'use client';

import React, { useState, useEffect } from 'react';
import { Communication, Lead } from '@/types/lead';
import { createMailtoUrl } from '@/lib/email/mailto';
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
  Mail,
  Copy,
  ExternalLink,
  ShieldCheck,
  CheckCheck,
} from 'lucide-react';

interface EmailDraftCardProps {
  leadId: string;
  lead?: Lead | null;
  communicationType?: 'initial_reply' | 'follow_up_1' | 'follow_up_2';
  followUpNumber?: number;
  initialCommunication?: Communication | null;
  onDraftUpdated?: () => void;
}

export function EmailDraftCard({
  leadId,
  lead,
  communicationType = 'initial_reply',
  followUpNumber = 1,
  initialCommunication,
  onDraftUpdated,
}: EmailDraftCardProps) {
  const [communication, setCommunication] = useState<Communication | null>(
    initialCommunication || null
  );
  const [isLoading, setIsLoading] = useState<boolean>(!initialCommunication);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isApproving, setIsApproving] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Email client handoff states
  const [composerOpened, setComposerOpened] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Editable fields
  const [subject, setSubject] = useState<string>(initialCommunication?.subject || '');
  const [body, setBody] = useState<string>(initialCommunication?.body || '');

  // 1. Fetch or generate draft on mount
  useEffect(() => {
    let isMounted = true;

    async function loadOrCreateDraft() {
      if (initialCommunication) {
        setCommunication(initialCommunication);
        setSubject(initialCommunication.subject);
        setBody(initialCommunication.body);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        if (communicationType === 'initial_reply') {
          // Fetch existing initial reply
          const res = await fetch(`/api/leads/${leadId}/draft`);
          const data = await res.json();

          if (data.communication && isMounted) {
            setCommunication(data.communication);
            setSubject(data.communication.subject);
            setBody(data.communication.body);
            setIsLoading(false);
            return;
          }

          // If none exists, generate initial draft
          const genRes = await fetch(`/api/leads/${leadId}/draft`, { method: 'POST' });
          const genData = await genRes.json();

          if (genData.communication && isMounted) {
            setCommunication(genData.communication);
            setSubject(genData.communication.subject);
            setBody(genData.communication.body);
          } else if (genData.error && isMounted) {
            setError(genData.error);
          }
        } else {
          // Fetch existing follow-up draft
          const res = await fetch(
            `/api/leads/${leadId}/followup-draft?number=${followUpNumber}`
          );
          const data = await res.json();
          const existing = data.communications?.find(
            (c: Communication) => c.type === communicationType
          );

          if (existing && isMounted) {
            setCommunication(existing);
            setSubject(existing.subject);
            setBody(existing.body);
            setIsLoading(false);
            return;
          }

          // If none exists, generate follow-up draft
          const genRes = await fetch(`/api/leads/${leadId}/followup-draft`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ follow_up_number: followUpNumber }),
          });
          const genData = await genRes.json();

          if (genData.communication && isMounted) {
            setCommunication(genData.communication);
            setSubject(genData.communication.subject);
            setBody(genData.communication.body);
          } else if (genData.error && isMounted) {
            setError(genData.error);
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to load/generate draft:', err);
          setError('Failed to initialize AI draft. You can retry generating below.');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadOrCreateDraft();

    return () => {
      isMounted = false;
    };
  }, [leadId, communicationType, followUpNumber, initialCommunication]);

  // Regenerate draft
  const handleRegenerate = async (force: boolean = false) => {
    setIsGenerating(true);
    setError(null);
    setSuccessMessage(null);

    try {
      let res;
      if (communicationType === 'initial_reply') {
        res = await fetch(`/api/leads/${leadId}/draft`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ force }),
        });
      } else {
        res = await fetch(`/api/leads/${leadId}/followup-draft`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ follow_up_number: followUpNumber, force }),
        });
      }

      const data = await res.json();

      if (!res.ok || !data.communication) {
        throw new Error(data.error || 'Failed to generate email draft.');
      }

      setCommunication(data.communication);
      setSubject(data.communication.subject);
      setBody(data.communication.body);
      setIsEditing(false);
      setComposerOpened(false);
      setSuccessMessage('AI generated a fresh personalized draft.');
      onDraftUpdated?.();
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
      onDraftUpdated?.();
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
      setSuccessMessage(
        'Email draft approved! You can now open your email composer to review and send.'
      );
      onDraftUpdated?.();
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      console.error('Approval error:', err);
      setError(err instanceof Error ? err.message : 'Error approving email.');
    } finally {
      setIsApproving(false);
    }
  };

  // Open in default email client via mailto:
  const handleOpenEmailComposer = () => {
    if (!communication) return;

    const targetRecipient = lead?.email || '';
    const mailto = createMailtoUrl({
      to: targetRecipient,
      subject: communication.subject,
      body: communication.body,
    });

    if (mailto.isTooLong) {
      setError(
        'This email body is too long for some email clients to open automatically via mailto. Please use "Copy Email" instead.'
      );
      return;
    }

    setError(null);
    setComposerOpened(true);

    // Trigger browser mailto handoff
    window.location.href = mailto.url;
  };

  // Copy email content fallback
  const handleCopyEmail = async () => {
    if (!communication) return;

    const mailto = createMailtoUrl({
      to: lead?.email || '',
      subject: communication.subject,
      body: communication.body,
    });

    try {
      await navigator.clipboard.writeText(mailto.formattedCopyText);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error('Clipboard copy failed:', err);
      setError('Could not copy automatically. Please select and copy the text manually.');
    }
  };

  const isApproved = communication?.status === 'APPROVED';
  const isSent = communication?.status === 'SENT';

  const titleText =
    communicationType === 'follow_up_1'
      ? 'Follow-Up #1 Draft'
      : communicationType === 'follow_up_2'
      ? 'Follow-Up #2 Draft (Final Check-In)'
      : 'Initial Agency Reply Draft';

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden transition-all">
      {/* Header Bar */}
      <div
        className={`p-5 sm:p-6 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
          isSent
            ? 'bg-emerald-50 border-emerald-200'
            : isApproved
            ? 'bg-blue-50/70 border-blue-200'
            : 'bg-gradient-to-r from-slate-50 to-indigo-50/40 border-slate-200'
        }`}
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
                isSent
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : isApproved
                  ? 'bg-blue-100 text-blue-800 border-blue-300'
                  : 'bg-amber-100 text-amber-800 border-amber-300'
              }`}
            >
              {isSent ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                  Email Sent (Historical)
                </>
              ) : isApproved ? (
                <>
                  <UserCheck className="w-3.5 h-3.5 text-blue-700" />
                  Human Approved • Ready to Compose
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                  AI Generated Draft • Awaiting Review
                </>
              )}
            </span>
            <span className="text-xs text-slate-500 hidden sm:inline">
              {communicationType === 'initial_reply' ? 'Initial Outreach' : `Follow-up #${followUpNumber}`}
            </span>
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            {isSent ? `Sent: ${titleText}` : isApproved ? `Approved: ${titleText}` : titleText}
          </h3>
        </div>

        {/* Action button controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Unapproved Draft Controls */}
          {!isApproved && !isSent && (
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

          {/* Approved & Ready for Handoff Controls */}
          {isApproved && !isSent && (
            <>
              {!isEditing ? (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  disabled={isLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                  Edit
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

              {/* Copy Email Fallback */}
              <button
                type="button"
                onClick={handleCopyEmail}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-sm"
                title="Copy subject and body to clipboard"
              >
                {copied ? (
                  <>
                    <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Copy Email</span>
                  </>
                )}
              </button>

              {/* Open in Default Email Client via mailto: */}
              <button
                type="button"
                onClick={handleOpenEmailComposer}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>{composerOpened ? 'Open Again' : 'Open Email Composer'}</span>
              </button>
            </>
          )}

          {/* Historical Sent State */}
          {isSent && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-semibold border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              Sent to {lead?.email || 'prospect'}
            </div>
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

      {/* Transparent Handoff Confirmation Notice */}
      {isApproved && composerOpened && (
        <div className="bg-blue-50/90 border-b border-blue-200 p-4 text-xs text-blue-900 flex items-start gap-3">
          <Mail className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">Email composer opened</div>
            <p className="text-blue-800 mt-0.5 leading-relaxed">
              Your approved email was opened in your default email client with recipient, subject, and body pre-filled. Review it in your client and click <strong>Send</strong> to deliver it.
            </p>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="p-8 text-center space-y-3">
          <div className="w-8 h-8 mx-auto border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-600">
            Generating personalized {titleText} with Gemini...
          </p>
          <p className="text-xs text-slate-400">
            Referencing {lead?.name || 'prospect'}&apos;s inquiry and communication history
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
            {isEditing && !isSent ? (
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
              {isEditing && !isSent && (
                <span className="text-[11px] font-normal text-blue-600">Editing draft...</span>
              )}
            </label>
            {isEditing && !isSent ? (
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
                <span className="flex items-center gap-1 text-blue-700 font-medium">
                  <Clock className="w-3 h-3 text-blue-600" />
                  Approved {new Date(communication.approved_at).toLocaleTimeString('en-US')}
                </span>
              )}
              {communication?.sent_at && (
                <span className="flex items-center gap-1 text-emerald-700 font-medium">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Sent {new Date(communication.sent_at).toLocaleString('en-US')}
                </span>
              )}
            </div>

            <div className="text-[11px] text-slate-400 italic">
              {isApproved
                ? 'Human approved. Click "Open Email Composer" to hand off to your email client.'
                : 'Review and approve before sending.'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
