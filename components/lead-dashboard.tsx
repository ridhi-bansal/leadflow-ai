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
  const [sourceFilter, setSourceFilter] = useState<string>('ALL');
  const [serviceFilter, setServiceFilter] = useState<string>('ALL');
  const [sortOption, setSortOption] = useState<string>('newest');
  const [selectedPriority, setSelectedPriority] = useState<'ALL' | 'RESPOND_NOW' | 'REVIEW' | 'LOW'>('ALL');

  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);

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

  // Priority categorization
  const priorityGroups = useMemo(() => {
    const respondNow = leads.filter(
      (l) =>
        l.qualification === 'HIGH' &&
        l.status !== 'APPROVED' &&
        (l.urgency === 'High' || (l.ai_score ?? 0) >= 80)
    );

    const review = leads.filter(
      (l) =>
        (l.qualification === 'HIGH' && !respondNow.includes(l)) ||
        l.qualification === 'MEDIUM' ||
        (l.missing_information && l.missing_information.length > 0) ||
        l.status === 'PENDING_APPROVAL'
    );

    const low = leads.filter(
      (l) =>
        l.qualification === 'LOW' ||
        ((l.ai_score ?? 0) < 50 && !respondNow.includes(l) && !review.includes(l))
    );

    return { respondNow, review, low };
  }, [leads]);

  // Apply Priority filter on top of fetched leads if selected
  const displayedLeads = useMemo(() => {
    if (selectedPriority === 'RESPOND_NOW') return priorityGroups.respondNow;
    if (selectedPriority === 'REVIEW') return priorityGroups.review;
    if (selectedPriority === 'LOW') return priorityGroups.low;
    return leads;
  }, [leads, selectedPriority, priorityGroups]);

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

  return (
    <div className="space-y-6">
      {/* 1. Priority Center ("Today's Priorities") */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Today&apos;s Priorities</h2>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded-md">
              Deterministic Action Matrix
            </span>
          </div>

          <button
            onClick={() => setSelectedPriority('ALL')}
            className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition ${
              selectedPriority === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Show All ({leads.length})
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Priority A: Respond Now */}
          <button
            onClick={() =>
              setSelectedPriority(selectedPriority === 'RESPOND_NOW' ? 'ALL' : 'RESPOND_NOW')
            }
            className={`p-5 rounded-2xl border text-left transition relative overflow-hidden group ${
              selectedPriority === 'RESPOND_NOW'
                ? 'bg-rose-50/80 border-rose-400 shadow-md ring-2 ring-rose-300'
                : 'bg-white border-slate-200 hover:border-rose-300 hover:shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                <Flame className="w-5 h-5 text-rose-600" />
              </div>
              <span className="text-2xl font-black text-rose-700">
                {priorityGroups.respondNow.length}
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-900">A — Respond Now</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              High-value &amp; high-intent leads requiring prompt agency follow-up.
            </p>
          </button>

          {/* Priority B: Review */}
          <button
            onClick={() =>
              setSelectedPriority(selectedPriority === 'REVIEW' ? 'ALL' : 'REVIEW')
            }
            className={`p-5 rounded-2xl border text-left transition relative overflow-hidden group ${
              selectedPriority === 'REVIEW'
                ? 'bg-amber-50/80 border-amber-400 shadow-md ring-2 ring-amber-300'
                : 'bg-white border-slate-200 hover:border-amber-300 hover:shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                <FileCheck className="w-5 h-5 text-amber-600" />
              </div>
              <span className="text-2xl font-black text-amber-700">
                {priorityGroups.review.length}
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-900">B — Review &amp; Scope</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Moderate potential or high leads missing technical info or needing review.
            </p>
          </button>

          {/* Priority C: Low Priority */}
          <button
            onClick={() =>
              setSelectedPriority(selectedPriority === 'LOW' ? 'ALL' : 'LOW')
            }
            className={`p-5 rounded-2xl border text-left transition relative overflow-hidden group ${
              selectedPriority === 'LOW'
                ? 'bg-slate-100 border-slate-400 shadow-md ring-2 ring-slate-300'
                : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold">
                <Coffee className="w-5 h-5 text-slate-500" />
              </div>
              <span className="text-2xl font-black text-slate-700">
                {priorityGroups.low.length}
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-900">C — Low / Exploratory</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Vague or low-budget casual inquiries with flexible or indefinite timeline.
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

            <button
              onClick={fetchLeads}
              className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 transition"
              title="Refresh leads"
              aria-label="Refresh leads"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

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
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
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

          {/* Source Filter */}
          <div className="flex items-center gap-1">
            {['ALL', 'form', 'email'].map((src) => (
              <button
                key={src}
                onClick={() => setSourceFilter(src)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
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

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter leads by status"
            className="px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="NEW">New</option>
            <option value="AI_ANALYZED">Analyzed</option>
            <option value="PENDING_APPROVAL">Pending Approval</option>
            <option value="APPROVED">Approved</option>
          </select>

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
              Try adjusting your search criteria or priority filters, or intake a new lead.
            </p>
            {onNavigateToIntake && (
              <button
                onClick={onNavigateToIntake}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition shadow-sm"
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
                  <th className="py-3.5 px-4">Intent / Urgency</th>
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

                    {/* Intent / Urgency */}
                    <td className="py-4 px-4">
                      <div className="text-slate-700 font-medium">
                        Intent: <strong>{lead.intent || 'Medium'}</strong>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Urgency: {lead.urgency || 'Medium'}
                      </div>
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
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 group-hover:bg-blue-600 group-hover:text-white text-slate-700 text-xs font-semibold rounded-lg transition"
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
