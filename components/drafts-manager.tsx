'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Communication, Lead } from '@/types/lead';
import {
  Mail,
  Search,
  CheckCircle2,
  Send,
  Sparkles,
  AlertCircle,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import { LeadDetailModal } from './lead-detail-modal';

interface DraftWithLead extends Communication {
  leads?: Partial<Lead> | Partial<Lead>[] | null;
}

export function DraftsManager() {
  const [drafts, setDrafts] = useState<DraftWithLead[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);

  const fetchDrafts = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (searchQuery.trim()) params.set('q', searchQuery.trim());

      const res = await fetch(`/api/drafts?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setDrafts(data.drafts || []);
      }
    } catch (err) {
      console.error('Failed to fetch drafts:', err);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    fetchDrafts();
  }, [fetchDrafts]);

  const handleOpenLead = (leadId: string) => {
    setSelectedLeadId(leadId);
    setIsDetailModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SENT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Sent (Historical)
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
            Human Approved • Ready to Compose
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            Rejected
          </span>
        );
      case 'DRAFT':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            AI Draft (Pending Review)
          </span>
        );
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'follow_up_1':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
            <RotateCcw className="w-3 h-3 text-indigo-600" />
            Follow-Up #1
          </span>
        );
      case 'follow_up_2':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
            <RotateCcw className="w-3 h-3 text-purple-600" />
            Follow-Up #2 (Final)
          </span>
        );
      case 'initial_reply':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
            <Mail className="w-3 h-3 text-slate-500" />
            Initial Reply
          </span>
        );
    }
  };

  const displayedDrafts = drafts.filter((d) => {
    if (typeFilter !== 'ALL' && d.type !== typeFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-bold text-slate-900">Email Draft Management</h2>
            <span className="text-xs bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-full border border-blue-200">
              {displayedDrafts.length} Messages
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Review, edit, approve, and compose initial outreach and follow-up emails with full human oversight.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filters */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {['ALL', 'DRAFT', 'APPROVED', 'SENT'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  statusFilter === st
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st === 'ALL'
                  ? 'All Statuses'
                  : st === 'DRAFT'
                  ? 'Pending Review'
                  : st === 'APPROVED'
                  ? 'Approved'
                  : 'Sent'}
              </button>
            ))}
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            aria-label="Filter drafts by communication type"
            className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Types</option>
            <option value="initial_reply">Initial Reply</option>
            <option value="follow_up_1">Follow-Up #1</option>
            <option value="follow_up_2">Follow-Up #2</option>
          </select>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search by prospect name, company, email, subject, or message content..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
        />
      </div>

      {/* Drafts List */}
      {isLoading ? (
        <div className="py-20 text-center space-y-3 bg-white rounded-2xl border border-slate-200">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Loading email drafts...</p>
        </div>
      ) : displayedDrafts.length === 0 ? (
        <div className="py-16 text-center space-y-3 bg-white rounded-2xl border border-slate-200 p-6">
          <Mail className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No email drafts found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery || statusFilter !== 'ALL' || typeFilter !== 'ALL'
              ? 'Try changing your search keywords or filter settings.'
              : 'Submit new leads or generate follow-ups to create AI drafts for human review.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedDrafts.map((draft) => {
            const leadObj = Array.isArray(draft.leads) ? draft.leads[0] : draft.leads;
            return (
              <div
                key={draft.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-blue-300 transition space-y-3"
              >
                {/* Top Row: Prospect & Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                      {leadObj?.name ? leadObj.name[0]?.toUpperCase() : 'L'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">
                          {leadObj?.name || 'Prospect'}
                        </span>
                        {leadObj?.company && (
                          <span className="text-xs text-slate-500">
                            • {leadObj.company}
                          </span>
                        )}
                        {getTypeBadge(draft.type)}
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {leadObj?.email || 'No email provided'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {getStatusBadge(draft.status)}
                    <span className="text-[11px] text-slate-400">
                      {new Date(draft.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Subject & Body Preview */}
                <div className="space-y-1.5">
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                    <span className="text-slate-400 font-normal">Subject:</span>
                    {draft.subject}
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-3 bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed font-mono text-[11px]">
                    {draft.body}
                  </p>
                </div>

                {/* Bottom Actions */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-4 text-[11px] text-slate-400">
                    {draft.approved_at && (
                      <span className="text-emerald-600 flex items-center gap-1 font-medium">
                        <CheckCircle2 className="w-3 h-3" /> Approved
                      </span>
                    )}
                    {draft.sent_at && (
                      <span className="text-blue-600 flex items-center gap-1 font-medium">
                        <Send className="w-3 h-3" /> Sent on {new Date(draft.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleOpenLead(draft.lead_id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg transition cursor-pointer"
                  >
                    <span>Review &amp; Edit Draft</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      <LeadDetailModal
        leadId={selectedLeadId}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedLeadId(null);
          fetchDrafts();
        }}
        onLeadUpdated={fetchDrafts}
      />
    </div>
  );
}
