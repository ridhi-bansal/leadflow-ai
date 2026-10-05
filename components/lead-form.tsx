'use client';

import React, { useState } from 'react';
import { Currency, Lead, LeadInput, QualificationResult as QualificationResultType, ServiceType, Timeline } from '@/types/lead';
import { LoadingState } from './loading-state';
import { QualificationResult } from './qualification-result';
import { ErrorState } from './error-state';
import {
  Send,
  Sparkles,
  Building2,
  Mail,
  User,
  DollarSign,
  Clock,
  Briefcase,
  MessageSquare,
  Zap,
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
};

export function LeadForm() {
  const [formData, setFormData] = useState<LeadInput>({
    name: '',
    email: '',
    company: '',
    service: '',
    budget: undefined,
    currency: 'USD',
    timeline: '',
    message: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'IDLE' | 'SUBMITTING' | 'ANALYZING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [createdLeadId, setCreatedLeadId] = useState<string | null>(null);
  const [createdLead, setCreatedLead] = useState<Lead | null>(null);
  const [qualificationResult, setQualificationResult] = useState<QualificationResultType | null>(null);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Contact name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address (e.g. name@company.com)';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Please provide details about your inquiry';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Please provide a little more detail (at least 10 characters)';
    }

    if (formData.budget !== undefined && formData.budget !== null && formData.budget <= 0) {
      newErrors.budget = 'Budget must be a positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFillSample = () => {
    setFormData(SARAH_MITCHELL_SAMPLE);
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setStatus('SUBMITTING');
    setErrorMessage('');

    try {
      // Step 1: Insert lead into Supabase
      const createRes = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          budget: formData.budget ? Number(formData.budget) : null,
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
        throw new Error(
          analyzeData.error || 'The lead was saved, but AI analysis failed. You can retry the analysis.'
        );
      }

      setCreatedLead(analyzeData.lead);
      setQualificationResult(analyzeData.qualification);
      setStatus('SUCCESS');
    } catch (err: unknown) {
      console.error('Lead submission / analysis error:', err);
      const msg = err instanceof Error ? err.message : "An unexpected error occurred. Please try again.";
      setErrorMessage(msg);
      setStatus('ERROR');
    }
  };

  const handleRetryAnalysis = async () => {
    if (!createdLeadId) {
      setStatus('IDLE');
      return;
    }

    setStatus('ANALYZING');
    setErrorMessage('');

    try {
      const analyzeRes = await fetch(`/api/leads/${createdLeadId}/analyze`, {
        method: 'POST',
      });

      const analyzeData = await analyzeRes.json();

      if (!analyzeRes.ok || !analyzeData.success) {
        throw new Error(
          analyzeData.error || 'The lead was saved, but AI analysis failed. You can retry the analysis.'
        );
      }

      setCreatedLead(analyzeData.lead);
      setQualificationResult(analyzeData.qualification);
      setStatus('SUCCESS');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Analysis retry failed. Please try again.';
      setErrorMessage(msg);
      setStatus('ERROR');
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
    });
    setErrors({});
    setStatus('IDLE');
    setCreatedLeadId(null);
    setCreatedLead(null);
    setQualificationResult(null);
  };

  if (status === 'ANALYZING') {
    return <LoadingState leadName={formData.name || formData.company} />;
  }

  if (status === 'SUCCESS' && qualificationResult) {
    return (
      <QualificationResult
        result={qualificationResult}
        lead={createdLead}
        onReset={handleReset}
      />
    );
  }

  if (status === 'ERROR') {
    return (
      <ErrorState
        title={createdLeadId ? 'Lead Saved, Analysis Failed' : 'Submission Failed'}
        message={errorMessage}
        leadId={createdLeadId}
        onRetry={createdLeadId ? handleRetryAnalysis : undefined}
        onReset={handleReset}
      />
    );
  }

  return (
    <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Card Header with Demo Quick Fill */}
      <div className="bg-slate-50/80 border-b border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-700 block mb-1">
            Northstar Studio Intake
          </span>
          <h2 className="text-xl font-bold text-slate-900">New Client Inquiry</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Submit a lead inquiry to trigger real-time AI qualification & scoring.
          </p>
        </div>

        <button
          type="button"
          onClick={handleFillSample}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer shrink-0"
        >
          <Zap className="w-3.5 h-3.5 text-indigo-600" />
          Load Sarah Mitchell Example (US Lead)
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
        {/* Row 1: Name & Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-slate-400" />
              Contact Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Sarah Mitchell"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full px-4 py-2.5 rounded-xl border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all ${
                errors.name
                  ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/30'
                  : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100 bg-white'
              }`}
            />
            {errors.name && <p className="text-xs text-rose-600 mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              Email Address <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              placeholder="e.g. sarah@oakandthread.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={`w-full px-4 py-2.5 rounded-xl border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all ${
                errors.email
                  ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/30'
                  : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100 bg-white'
              }`}
            />
            {errors.email && <p className="text-xs text-rose-600 mt-1">{errors.email}</p>}
          </div>
        </div>

        {/* Row 2: Company & Service */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              Company / Brand Name
            </label>
            <input
              type="text"
              placeholder="e.g. Oak & Thread Apparel"
              value={formData.company || ''}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm text-slate-900 placeholder:text-slate-400 bg-white focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1">
              <Briefcase className="w-3.5 h-3.5 text-slate-400" />
              Requested Service
            </label>
            <select
              value={formData.service || ''}
              onChange={(e) => setFormData({ ...formData, service: e.target.value as ServiceType })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm text-slate-900 bg-white focus:outline-none transition-all cursor-pointer"
            >
              <option value="">Select a service (optional)</option>
              {SERVICES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 3: Budget, Currency & Timeline */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="sm:col-span-2 grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                Budget
              </label>
              <input
                type="number"
                min="0"
                step="100"
                placeholder="e.g. 8000"
                value={formData.budget !== undefined && formData.budget !== null ? formData.budget : ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    budget: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                className={`w-full px-4 py-2.5 rounded-xl border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all ${
                  errors.budget
                    ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/30'
                    : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100 bg-white'
                }`}
              />
              {errors.budget && <p className="text-xs text-rose-600 mt-1">{errors.budget}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Currency
              </label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value as Currency })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm font-semibold text-slate-900 bg-white focus:outline-none transition-all cursor-pointer"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Target Timeline
            </label>
            <select
              value={formData.timeline || ''}
              onChange={(e) => setFormData({ ...formData, timeline: e.target.value as Timeline })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm text-slate-900 bg-white focus:outline-none transition-all cursor-pointer"
            >
              <option value="">Select timeline (optional)</option>
              {TIMELINES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 4: Message */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1">
            <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
            Inquiry Message / Project Scope <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={4}
            placeholder="Tell us what you are looking to build, launch, or achieve..."
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            className={`w-full px-4 py-3 rounded-xl border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all resize-y ${
              errors.message
                ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/30'
                : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100 bg-white'
            }`}
          />
          {errors.message && <p className="text-xs text-rose-600 mt-1">{errors.message}</p>}
        </div>

        {/* Submit Button */}
        <div className="pt-2 flex items-center justify-between">
          <span className="text-xs text-slate-400 hidden sm:inline">
            Deterministic scoring + Gemini structured analysis
          </span>

          <button
            type="submit"
            disabled={status === 'SUBMITTING'}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold text-sm rounded-xl transition-all shadow-sm hover:shadow cursor-pointer"
          >
            {status === 'SUBMITTING' ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin" />
                Saving to Database...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Submit & Qualify Lead
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
