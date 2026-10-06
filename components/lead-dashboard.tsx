'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Lead } from '@/types/lead';
import { LeadDetailModal } from './lead-detail-modal';
import {
  Search,
  Filter,
  ArrowUpDown,
  ChevronRight,
  Flame,
  FileCheck,
  Coffee,
  Plus,
  RefreshCw,
  Mail,
  CheckCircle2,
  Clock,
  MessageSquare,
  Download,
  ChevronDown,
} from 'lucide-react';

interface LeadDashboardProps {
  onNavigateToIntake?: () => void;
}

export function LeadDashboard({ onNavigateToIntake }: LeadDashboardProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [qualificationFilter, setQualificationFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [responseFilter, setResponseFilter] = useState<string>('ALL');
  const [sourceFilter, setSourceFilter] = useState<string>('ALL');
  const [serviceFilter, setServiceFilter] = useState<string>('ALL');
  const [sortOption, setSortOption] = useState<string>('newest');
  const [selectedPriority, setSelectedPriority] = useState<
    'ALL' | 'RESPOND_NOW' | 'REPLIED' | 'REVIEW' | 'LOW'
  >('ALL');

  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);

  // Export State
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState<boolean>(false);
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);

  const handleExport = async (scope: 'all' | 'view') => {
    setIsExporting(true);
    setIsExportMenuOpen(false);
    setExportFeedback('Exporting CRM workbook...');

    try {
      const params = new URLSearchParams();
      params.set('scope', scope);

      if (scope === 'view') {
        if (searchQuery.trim()) params.set('q', searchQuery.trim());
        if (qualificationFilter !== 'ALL') params.set('qualification', qualificationFilter);
        if (statusFilter !== 'ALL') params.set('status', statusFilter);
        if (responseFilter !== 'ALL') params.set('response', responseFilter);
        if (sourceFilter !== 'ALL') params.set('source', sourceFilter);
        if (serviceFilter !== 'ALL') params.set('service', serviceFilter);
        params.set('sort', sortOption);
      }

      // Download file directly
      const downloadUrl = `/api/export/crm?${params.toString()}`;
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', '');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setExportFeedback('Export complete! Download started.');
      setTimeout(() => setExportFeedback(null), 3500);
    } catch (err) {
      console.error('Export failed:', err);
      setExportFeedback('Could not export CRM data. Please try again.');
      setTimeout(() => setExportFeedback(null), 4000);
    } finally {
      setIsExporting(false);
    }
  };

  const fetchLeads = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set('q', searchQuery.trim());
      if (qualificationFilter !== 'ALL') params.set('qualification', qualificationFilter);
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (sourceFilter !== 'ALL') params.set('source', sourceFilter);
      if (serviceFilter !== 'ALL') params.set('service', serviceFilter);
      params.set('sort', sortOption);

      const res = await fetch(`/api/leads?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads || []);
      }
    } catch (err) {
      console.error('Failed to fetch leads:', err);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, qualificationFilter, statusFilter, sourceFilter, serviceFilter, sortOption]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Operational Priority Categorization
  const priorityGroups = useMemo(() => {
    // 1. Leads that have replied -> Needs conversation review
    const replied = leads.filter((l) => l.response_status === 'replied');

    // 2. High priority needing action today:
    // - High qualification and not yet approved
    // - OR has follow-up recommended and not replied
    // - Excludes replied leads and leads with 2 follow-ups completed
    const respondNow = leads.filter((l) => {
      if (l.response_status === 'replied') return false;
      const isHigh = l.qualification === 'HIGH' || (l.ai_score ?? 0) >= 80;
      const hasFollowUpDue = l.response_status === 'no_response';
      const isUnapproved = l.status !== 'APPROVED';
      return isHigh && (isUnapproved || hasFollowUpDue);
    });

    // 3. Moderate potential / Review & Scope
    const review = leads.filter((l) => {
      if (l.response_status === 'replied') return false;
      if (respondNow.includes(l)) return false;
      return (
        l.qualification === 'MEDIUM' ||
        (l.missing_information && l.missing_information.length > 0) ||
        l.status === 'PENDING_APPROVAL'
      );
    });

    // 4. Low priority or Dormant
    const low = leads.filter(
      (l) => !replied.includes(l) && !respondNow.includes(l) && !review.includes(l)
    );

    return { respondNow, replied, review, low };
  }, [leads]);

  // Filter based on selected priority card
  const displayedLeads = useMemo(() => {
    let filtered = leads;

    if (selectedPriority === 'RESPOND_NOW') filtered = priorityGroups.respondNow;
    else if (selectedPriority === 'REPLIED') filtered = priorityGroups.replied;
    else if (selectedPriority === 'REVIEW') filtered = priorityGroups.review;
    else if (selectedPriority === 'LOW') filtered = priorityGroups.low;

    if (responseFilter !== 'ALL') {
      filtered = filtered.filter((l) => (l.response_status || 'waiting') === responseFilter);
    }

    return filtered;
  }, [leads, selectedPriority, responseFilter, priorityGroups]);

  const handleOpenLead = (leadId: string) => {
    setSelectedLeadId(leadId);
    setIsDetailModalOpen(true);
  };

  const getQualificationBadge = (qual: string | null, score: number | null) => {
    switch (qual) {
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            HIGH ({score ?? '—'})
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            MEDIUM ({score ?? '—'})
          </span>
        );
      case 'LOW':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            LOW ({score ?? '—'})
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-50 text-slate-500 border border-slate-200">
            UNSCORED
          </span>
        );
    }
  };

  const getResponseStatusBadge = (status?: string) => {
    switch (status) {
      case 'replied':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Replied
          </span>
        );
      case 'no_response':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3 h-3 text-amber-600" />
            No Response
          </span>
        );
      case 'waiting':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold text-slate-500 bg-slate-100 border border-slate-200">
            Waiting
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Operational Priority Center */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Today&apos;s Action Matrix</h2>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded-md">
              Operational Priority Engine
            </span>
          </div>

          <button
            onClick={() => setSelectedPriority('ALL')}
            className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition cursor-pointer ${
              selectedPriority === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Show All ({leads.length})
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Priority A: Follow Up Today */}
          <button
            onClick={() =>
              setSelectedPriority(selectedPriority === 'RESPOND_NOW' ? 'ALL' : 'RESPOND_NOW')
            }
            className={`p-4 rounded-2xl border text-left transition relative overflow-hidden group cursor-pointer ${
              selectedPriority === 'RESPOND_NOW'
                ? 'bg-rose-50/80 border-rose-400 shadow-md ring-2 ring-rose-300'
                : 'bg-white border-slate-200 hover:border-rose-300 hover:shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                <Flame className="w-4 h-4 text-rose-600" />
              </div>
              <span className="text-2xl font-black text-rose-700">
                {priorityGroups.respondNow.length}
              </span>
            </div>
            <h3 className="text-xs font-bold text-slate-900">🔴 Act / Follow Up Today</h3>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed line-clamp-2">
              High-value prospects needing initial reply or scheduled follow-up.
            </p>
          </button>

          {/* 2. Needs Response Review (Replied) */}
          <button
            onClick={() =>
              setSelectedPriority(selectedPriority === 'REPLIED' ? 'ALL' : 'REPLIED')
            }
            className={`p-4 rounded-2xl border text-left transition relative overflow-hidden group cursor-pointer ${
              selectedPriority === 'REPLIED'
                ? 'bg-emerald-50/80 border-emerald-400 shadow-md ring-2 ring-emerald-300'
                : 'bg-white border-slate-200 hover:border-emerald-300 hover:shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
              </div>
              <span className="text-2xl font-black text-emerald-700">
                {priorityGroups.replied.length}
              </span>
            </div>
            <h3 className="text-xs font-bold text-slate-900">🟢 Needs Response Review</h3>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed line-clamp-2">
              Prospects who replied. Follow-ups paused for human conversation.
            </p>
          </button>

          {/* 3. Priority B: Review & Scope */}
          <button
            onClick={() =>
              setSelectedPriority(selectedPriority === 'REVIEW' ? 'ALL' : 'REVIEW')
            }
            className={`p-4 rounded-2xl border text-left transition relative overflow-hidden group cursor-pointer ${
              selectedPriority === 'REVIEW'
                ? 'bg-amber-50/80 border-amber-400 shadow-md ring-2 ring-amber-300'
                : 'bg-white border-slate-200 hover:border-amber-300 hover:shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                <FileCheck className="w-4 h-4 text-amber-600" />
              </div>
              <span className="text-2xl font-black text-amber-700">
                {priorityGroups.review.length}
              </span>
            </div>
            <h3 className="text-xs font-bold text-slate-900">🟡 Review &amp; Scope</h3>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed line-clamp-2">
              Moderate tier or inquiries missing budget/timeline info.
            </p>
          </button>

          {/* 4. Priority C: Low / Dormant */}
          <button
            onClick={() =>
              setSelectedPriority(selectedPriority === 'LOW' ? 'ALL' : 'LOW')
            }
            className={`p-4 rounded-2xl border text-left transition relative overflow-hidden group cursor-pointer ${
              selectedPriority === 'LOW'
                ? 'bg-slate-100 border-slate-400 shadow-md ring-2 ring-slate-300'
                : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold">
                <Coffee className="w-4 h-4 text-slate-500" />
              </div>
              <span className="text-2xl font-black text-slate-700">
                {priorityGroups.low.length}
              </span>
            </div>
            <h3 className="text-xs font-bold text-slate-900">⚪ Low / Dormant</h3>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed line-clamp-2">
              Exploratory inquiries or leads past sequence limit.
            </p>
          </button>
        </div>
      </section>

      {/* 2. Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Keyword Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search leads by name, company, email, service, or message..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Sorting Dropdown */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-600">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                aria-label="Sort leads by"
                className="bg-transparent focus:outline-none text-xs text-slate-800 font-semibold cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="highest_score">Highest Score</option>
                <option value="lowest_score">Lowest Score</option>
                <option value="highest_budget">Highest Budget</option>
              </select>
            </div>

            {/* Export CRM Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                disabled={isExporting}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-50 cursor-pointer"
                title="Export CRM data to Excel (.xlsx)"
              >
                <Download className={`w-3.5 h-3.5 ${isExporting ? 'animate-bounce' : ''}`} />
                <span>{isExporting ? 'Exporting...' : 'Export CRM'}</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-80" />
              </button>

              {isExportMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-30 py-1 text-xs animate-in fade-in duration-150">
                  <button
                    type="button"
                    onClick={() => handleExport('all')}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center justify-between text-slate-800 font-medium transition cursor-pointer"
                  >
                    <span>📊 Export All Leads (.xlsx)</span>
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                      {leads.length}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExport('view')}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center justify-between text-slate-800 font-medium transition cursor-pointer border-t border-slate-100"
                  >
                    <span>🔍 Export Current View (.xlsx)</span>
                    <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-1.5 py-0.5 rounded">
                      {displayedLeads.length}
                    </span>
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={fetchLeads}
              className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 transition cursor-pointer"
              title="Refresh leads"
              aria-label="Refresh leads"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Export Feedback Banner */}
        {exportFeedback && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{exportFeedback}</span>
          </div>
        )}

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3" /> Filters:
          </span>

          {/* Qualification Filter */}
          <div className="flex items-center gap-1">
            {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map((q) => (
              <button
                key={q}
                onClick={() => setQualificationFilter(q)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                  qualificationFilter === q
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {q === 'ALL' ? 'All Tiers' : q}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter leads by lifecycle status"
            className="px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Stages</option>
            <option value="NEW">New</option>
            <option value="AI_ANALYZED">AI Analyzed</option>
            <option value="PENDING_APPROVAL">Pending Approval</option>
            <option value="APPROVED">Approved</option>
          </select>

          <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />

          {/* Response Status Filter */}
          <select
            value={responseFilter}
            onChange={(e) => setResponseFilter(e.target.value)}
            aria-label="Filter leads by response status"
            className="px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Responses</option>
            <option value="waiting">Waiting for Response</option>
            <option value="replied">✓ Replied</option>
            <option value="no_response">No Response</option>
          </select>

          <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />

          {/* Source Filter */}
          <div className="flex items-center gap-1">
            {['ALL', 'form', 'email'].map((src) => (
              <button
                key={src}
                onClick={() => setSourceFilter(src)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                  sourceFilter === src
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {src === 'ALL' ? 'All Sources' : src === 'form' ? 'Form Intake' : 'Email Paste'}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />

          {/* Service Filter */}
          <select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            aria-label="Filter leads by service category"
            className="px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Services</option>
            <option value="Website Development">Website Development</option>
            <option value="Branding & Design">Branding &amp; Design</option>
            <option value="Social Media">Social Media</option>
            <option value="Digital Advertising">Digital Advertising</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      {/* 3. Leads Table / List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-medium">Fetching lead records...</p>
          </div>
        ) : displayedLeads.length === 0 ? (
          <div className="py-16 text-center space-y-3 p-6">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Mail className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No matching leads found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try adjusting your search criteria or action filters, or intake a new lead.
            </p>
            {onNavigateToIntake && (
              <button
                onClick={onNavigateToIntake}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Intake New Lead
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Prospect</th>
                  <th className="py-3.5 px-4">Service &amp; Budget</th>
                  <th className="py-3.5 px-4">AI Score &amp; Tier</th>
                  <th className="py-3.5 px-4">Response Status</th>
                  <th className="py-3.5 px-4">Source</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    onClick={() => handleOpenLead(lead.id)}
                    className="hover:bg-blue-50/40 transition cursor-pointer group"
                  >
                    {/* Prospect Column */}
                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-900 group-hover:text-blue-600 transition">
                        {lead.name}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                        {lead.company && <span>{lead.company} •</span>}
                        <span>{lead.email}</span>
                      </div>
                    </td>

                    {/* Service & Budget */}
                    <td className="py-4 px-4">
                      <div className="font-medium text-slate-800">
                        {lead.service || 'General Inquiry'}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {lead.budget
                          ? `$${lead.budget.toLocaleString('en-US')} ${lead.currency || 'USD'}`
                          : 'No budget'}
                      </div>
                    </td>

                    {/* AI Score & Tier */}
                    <td className="py-4 px-4">
                      {getQualificationBadge(lead.qualification, lead.ai_score)}
                    </td>

                    {/* Response Status */}
                    <td className="py-4 px-4">
                      {getResponseStatusBadge(lead.response_status)}
                    </td>

                    {/* Source */}
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] uppercase font-bold tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                        {lead.source || 'form'}
                      </span>
                    </td>

                    {/* Created Date */}
                    <td className="py-4 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                      {new Date(lead.created_at).toLocaleDateString()}
                    </td>

                    {/* Action */}
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenLead(lead.id);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 group-hover:bg-blue-600 group-hover:text-white text-slate-700 text-xs font-semibold rounded-lg transition cursor-pointer"
                      >
                        <span>Details</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <LeadDetailModal
        leadId={selectedLeadId}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedLeadId(null);
          fetchLeads();
        }}
        onLeadUpdated={fetchLeads}
      />
    </div>
  );
}
