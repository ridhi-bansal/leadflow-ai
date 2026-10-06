'use client';

import React, { useState } from 'react';
import {
  Currency,
  Lead,
  LeadInput,
  QualificationResult as QualificationResultType,
  ServiceType,
  Timeline,
  ExtractedLeadData,
} from '@/types/lead';
import { LoadingState } from './loading-state';
import { QualificationResult } from './qualification-result';
import { ErrorState } from './error-state';
import {
  Sparkles,
  Building2,
  Mail,
  User,
  DollarSign,
  Clock,
  Briefcase,
  MessageSquare,
  Zap,
  FileText,
  CheckCircle2,
  ArrowRight,
  ClipboardPaste,
} from 'lucide-react';

const SERVICES: ServiceType[] = [
  'Website Development',
  'Branding & Design',
  'Social Media',
  'Digital Advertising',
  'Other',
];

const TIMELINES: Timeline[] = [
  'ASAP',
  'Within 1 week',
  'Within 1 month',
  '1–3 months',
  'Flexible',
  'Not decided',
];

const CURRENCIES: Currency[] = ['USD', 'EUR', 'GBP', 'CAD', 'AUD'];

const SARAH_MITCHELL_SAMPLE: LeadInput = {
  name: 'Sarah Mitchell',
  email: 'sarah@oakandthread.com',
  company: 'Oak & Thread Apparel',
  service: 'Website Development',
  budget: 8000,
  currency: 'USD',
  timeline: 'Within 1 month',
  message:
    "Hi, I'm launching a new clothing brand called Oak & Thread Apparel and I'm looking for someone to build an ecommerce website for us. We'd like to launch within the next month and have a budget of around $8,000. We're looking for a clean, modern site with product pages, checkout, and basic email signup. We'd love to know what the next steps would be.",
  source: 'form',
};

const SAMPLE_RAW_EMAIL = `From: David Vance <david@vancetech.io>
Subject: Inquiring about Branding & Website Redesign for VanceTech
Date: October 6, 2026 at 10:14 AM EDT
To: hello@northstarstudio.com

Hi Northstar team,

I'm the founder of VanceTech, a B2B SaaS startup in the cybersecurity space. We recently closed a seed round and need a complete brand identity revamp and a new marketing website.

Our ideal launch timeframe is within the next 1-3 months. We have allocated approximately $15,000 for this project and want something sleek, modern, and high-converting with interactive product demo mockups.

Looking forward to hearing about your process and availability.

Best,
David Vance
Founder & CEO, VanceTech
david@vancetech.io
(555) 234-8901`;

export function LeadForm() {
  const [intakeMode, setIntakeMode] = useState<'structured' | 'email'>('structured');

  // Mode A: Structured Form state
  const [formData, setFormData] = useState<LeadInput>({
    name: '',
    email: '',
    company: '',
    service: '',
    budget: undefined,
    currency: 'USD',
    timeline: '',
    message: '',
    source: 'form',
  });

  // Mode B: Paste Email state
  const [rawEmailText, setRawEmailText] = useState<string>('');
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [extractedData, setExtractedData] = useState<ExtractedLeadData | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<
    'IDLE' | 'EXTRACTING' | 'SUBMITTING' | 'ANALYZING' | 'SUCCESS' | 'ERROR'
  >('IDLE');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [createdLeadId, setCreatedLeadId] = useState<string | null>(null);
  const [createdLead, setCreatedLead] = useState<Lead | null>(null);
  const [qualificationResult, setQualificationResult] =
    useState<QualificationResultType | null>(null);

  const validateForm = (dataToValidate: LeadInput): boolean => {
    const newErrors: Record<string, string> = {};

    if (!dataToValidate.name.trim()) {
      newErrors.name = 'Contact name is required';
    }

    if (!dataToValidate.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dataToValidate.email.trim())) {
      newErrors.email = 'Please enter a valid email address (e.g. name@company.com)';
    }

    if (!dataToValidate.message.trim()) {
      newErrors.message = 'Please provide details about your inquiry';
    } else if (dataToValidate.message.trim().length < 10) {
      newErrors.message = 'Please provide a little more detail (at least 10 characters)';
    }

    if (
      dataToValidate.budget !== undefined &&
      dataToValidate.budget !== null &&
      dataToValidate.budget <= 0
    ) {
      newErrors.budget = 'Budget must be a positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFillSample = () => {
    setFormData(SARAH_MITCHELL_SAMPLE);
    setErrors({});
  };

  const handleFillSampleEmail = () => {
    setRawEmailText(SAMPLE_RAW_EMAIL);
    setErrors({});
  };

  // Mode B: Extract lead details using Gemini
  const handleExtractFromEmail = async () => {
    if (!rawEmailText.trim() || rawEmailText.trim().length < 10) {
      setErrors({ emailText: 'Please paste a valid inquiry email (at least 10 characters)' });
      return;
    }

    setIsExtracting(true);
    setErrors({});
    setErrorMessage('');

    try {
      const res = await fetch('/api/leads/extract-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawEmail: rawEmailText }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to extract lead details from email.');
      }

      setExtractedData(data.extracted);
    } catch (err) {
      console.error('Email extraction error:', err);
      setErrorMessage(
        err instanceof Error ? err.message : 'Error extracting lead details. Please try again.'
      );
    } finally {
      setIsExtracting(false);
    }
  };

  // Submit and Qualify Lead (Works for both Mode A and Mode B)
  const handleExecuteSaveAndQualify = async (targetLead: LeadInput) => {
    if (!validateForm(targetLead)) return;

    setStatus('SUBMITTING');
    setErrorMessage('');

    try {
      // Step 1: Insert lead into Supabase
      const createRes = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...targetLead,
          budget: targetLead.budget ? Number(targetLead.budget) : null,
          source: targetLead.source || (intakeMode === 'email' ? 'email' : 'form'),
        }),
      });

      const createData = await createRes.json();

      if (!createRes.ok || !createData.success) {
        throw new Error(createData.error || "We couldn't save this lead. Please try again.");
      }

      const leadId = createData.id;
      setCreatedLeadId(leadId);
      setCreatedLead(createData.lead);

      // Step 2: Trigger AI analysis
      setStatus('ANALYZING');

      const analyzeRes = await fetch(`/api/leads/${leadId}/analyze`, {
        method: 'POST',
      });

      const analyzeData = await analyzeRes.json();

      if (!analyzeRes.ok || !analyzeData.success) {
        throw new Error(analyzeData.error || 'Lead saved, but AI qualification failed.');
      }

      setQualificationResult(analyzeData.qualification);
      setStatus('SUCCESS');
    } catch (err) {
      console.error('Lead submission failure:', err);
      setStatus('ERROR');
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred while processing the lead.'
      );
    }
  };

  const handleReset = () => {
    setFormData({
      name: '',
      email: '',
      company: '',
      service: '',
      budget: undefined,
      currency: 'USD',
      timeline: '',
      message: '',
      source: 'form',
    });
    setRawEmailText('');
    setExtractedData(null);
    setErrors({});
    setStatus('IDLE');
    setErrorMessage('');
    setCreatedLeadId(null);
    setCreatedLead(null);
    setQualificationResult(null);
  };

  // Loading & Analyzing States
  if (status === 'SUBMITTING' || status === 'ANALYZING') {
    return (
      <LoadingState
        leadName={formData.name || extractedData?.name}
      />
    );
  }

  // Error State
  if (status === 'ERROR') {
    return (
      <ErrorState
        title="Processing Error"
        message={errorMessage}
        leadId={createdLeadId}
        onRetry={() => {
          if (createdLeadId) {
            setStatus('ANALYZING');
            fetch(`/api/leads/${createdLeadId}/analyze`, { method: 'POST' })
              .then((res) => res.json())
              .then((data) => {
                if (data.success) {
                  setQualificationResult(data.qualification);
                  setStatus('SUCCESS');
                } else {
                  throw new Error(data.error);
                }
              })
              .catch((err) => {
                setErrorMessage(err.message);
                setStatus('ERROR');
              });
          } else {
            setStatus('IDLE');
          }
        }}
        onReset={handleReset}
      />
    );
  }

  // Success State
  if (status === 'SUCCESS' && qualificationResult) {
    return (
      <QualificationResult
        result={qualificationResult}
        lead={createdLead}
        onReset={handleReset}
      />
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Intake Mode Switcher */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIntakeMode('structured')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
            intakeMode === 'structured'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Mode A: Structured Lead Form</span>
        </button>

        <button
          type="button"
          onClick={() => setIntakeMode('email')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
            intakeMode === 'email'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ClipboardPaste className="w-4 h-4" />
          <span>Mode B: Paste Lead Email</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* MODE A: STRUCTURED FORM */}
      {/* ========================================================================= */}
      {intakeMode === 'structured' && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleExecuteSaveAndQualify(formData);
          }}
          className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                Structured Agency Inquiry Intake
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Direct client inquiry submission for Northstar Studio.
              </p>
            </div>

            <button
              type="button"
              onClick={handleFillSample}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold transition border border-blue-200/60"
            >
              <Zap className="w-3.5 h-3.5 text-blue-600" />
              <span>Fill Sarah Mitchell (Demo)</span>
            </button>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Contact Details Grid */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  Contact Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sarah Mitchell"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-3.5 py-2.5 text-xs bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
                    errors.name ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                  }`}
                />
                {errors.name && <p className="text-[11px] text-rose-500 mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  placeholder="e.g. sarah@oakandthread.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full px-3.5 py-2.5 text-xs bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
                    errors.email ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                  }`}
                />
                {errors.email && <p className="text-[11px] text-rose-500 mt-1">{errors.email}</p>}
              </div>
            </div>

            {/* Company & Service Grid */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  Company / Brand Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Oak & Thread Apparel"
                  value={formData.company || ''}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                  Service Requested
                </label>
                <select
                  value={formData.service || ''}
                  onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition cursor-pointer"
                >
                  <option value="">Select a service...</option>
                  {SERVICES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Budget & Timeline Grid */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                  Estimated Budget &amp; Currency
                </label>
                <div className="flex gap-2">
                  <select
                    value={formData.currency}
                    onChange={(e) =>
                      setFormData({ ...formData, currency: e.target.value as Currency })
                    }
                    className="w-24 px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition cursor-pointer font-semibold"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    placeholder="e.g. 8000"
                    value={formData.budget !== undefined && formData.budget !== null ? formData.budget : ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        budget: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    className={`flex-1 px-3.5 py-2.5 text-xs bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition font-mono ${
                      errors.budget ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                    }`}
                  />
                </div>
                {errors.budget && <p className="text-[11px] text-rose-500 mt-1">{errors.budget}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Target Timeline
                </label>
                <select
                  value={formData.timeline || ''}
                  onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition cursor-pointer"
                >
                  <option value="">Select launch timeline...</option>
                  {TIMELINES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Inquiry Message */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                Project Details &amp; Inquiry Message <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={4}
                placeholder="Describe project deliverables, goals, technical requirements, or expectations..."
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className={`w-full px-3.5 py-2.5 text-xs bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition leading-relaxed ${
                  errors.message ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                }`}
              />
              {errors.message && <p className="text-[11px] text-rose-500 mt-1">{errors.message}</p>}
            </div>
          </div>

          {/* Form Footer Action */}
          <div className="px-6 sm:px-8 py-5 bg-slate-50/80 border-t border-slate-200 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Saves to Supabase &amp; triggers Google Gemini lead analysis
            </span>

            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-blue-200" />
              <span>Submit &amp; Qualify Lead</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* MODE B: PASTE LEAD EMAIL */}
      {/* ========================================================================= */}
      {intakeMode === 'email' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-6 sm:p-8 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <ClipboardPaste className="w-5 h-5 text-indigo-600" />
                  Paste Prospect Email Inquiry
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Paste raw text from a prospect email, contact forward, or thread. Gemini will extract structured fields for your review.
                </p>
              </div>

              <button
                type="button"
                onClick={handleFillSampleEmail}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold transition border border-indigo-200/60 self-start sm:self-auto"
              >
                <Zap className="w-3.5 h-3.5 text-indigo-600" />
                <span>Paste Sample Inbound Email</span>
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Raw Email Text / Thread
              </label>
              <textarea
                rows={8}
                placeholder="Paste the full raw email text or inquiry message here..."
                value={rawEmailText}
                onChange={(e) => setRawEmailText(e.target.value)}
                className={`w-full px-3.5 py-3 text-xs bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition font-mono leading-relaxed ${
                  errors.emailText ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                }`}
              />
              {errors.emailText && (
                <p className="text-[11px] text-rose-500 mt-1">{errors.emailText}</p>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500">
                AI extraction is reviewed by you before saving
              </span>

              <button
                type="button"
                onClick={handleExtractFromEmail}
                disabled={isExtracting}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-sm disabled:opacity-50"
              >
                {isExtracting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Extracting Structured Fields...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-indigo-200" />
                    <span>Extract Lead Details with Gemini</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Review Card for Extracted Data */}
          {extractedData && (
            <div className="bg-white border-2 border-indigo-200 rounded-2xl shadow-md overflow-hidden p-6 sm:p-8 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Extracted Lead Review &amp; Edit
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Verify or adjust any extracted fields before storing and qualifying.
                    </p>
                  </div>
                </div>

                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Ready for Review
                </span>
              </div>

              {/* Editable Fields Grid */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                    Contact Name *
                  </label>
                  <input
                    type="text"
                    value={extractedData.name}
                    onChange={(e) =>
                      setExtractedData({ ...extractedData, name: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={extractedData.email}
                    onChange={(e) =>
                      setExtractedData({ ...extractedData, email: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                    Company / Brand
                  </label>
                  <input
                    type="text"
                    value={extractedData.company || ''}
                    onChange={(e) =>
                      setExtractedData({ ...extractedData, company: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                    Service
                  </label>
                  <select
                    value={extractedData.service || ''}
                    onChange={(e) =>
                      setExtractedData({ ...extractedData, service: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="">Select service...</option>
                    {SERVICES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                    Budget &amp; Currency
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={extractedData.currency}
                      onChange={(e) =>
                        setExtractedData({
                          ...extractedData,
                          currency: e.target.value as Currency,
                        })
                      }
                      className="w-24 px-2 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold cursor-pointer"
                    >
                      {CURRENCIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={extractedData.budget !== null && extractedData.budget !== undefined ? extractedData.budget : ''}
                      onChange={(e) =>
                        setExtractedData({
                          ...extractedData,
                          budget: e.target.value ? Number(e.target.value) : null,
                        })
                      }
                      placeholder="Budget"
                      className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                    Timeline
                  </label>
                  <input
                    type="text"
                    value={extractedData.timeline || ''}
                    onChange={(e) =>
                      setExtractedData({ ...extractedData, timeline: e.target.value })
                    }
                    placeholder="e.g. Within 1 month"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                  Extracted Project Message *
                </label>
                <textarea
                  rows={3}
                  value={extractedData.message}
                  onChange={(e) =>
                    setExtractedData({ ...extractedData, message: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                />
              </div>

              {extractedData.notes && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-600">
                  <span className="font-bold text-slate-700">Extraction Context: </span>
                  {extractedData.notes}
                </div>
              )}

              {/* Action */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setExtractedData(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Discard &amp; Re-paste
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleExecuteSaveAndQualify({
                      name: extractedData.name,
                      email: extractedData.email,
                      company: extractedData.company || undefined,
                      service: extractedData.service || undefined,
                      budget: extractedData.budget,
                      currency: extractedData.currency,
                      timeline: extractedData.timeline || undefined,
                      message: rawEmailText || extractedData.message,
                      source: 'email',
                    })
                  }
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-sm"
                >
                  <Sparkles className="w-4 h-4 text-emerald-200" />
                  <span>Save &amp; Qualify Extracted Lead</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
