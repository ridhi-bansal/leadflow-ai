import * as XLSX from 'xlsx';
import type { FollowUp, Lead } from '../../types/lead';

/**
 * Deterministically calculates the operational priority tier for a lead.
 * Matches the logic in LeadDashboard.
 */
export function getLeadPriorityLabel(lead: Lead): string {
  if (lead.response_status === 'replied') {
    return 'Replied (Needs Review)';
  }

  const isHigh = lead.qualification === 'HIGH' || (lead.ai_score ?? 0) >= 80;
  const isUnapproved = lead.status !== 'APPROVED';
  const hasFollowUpDue = lead.response_status === 'no_response';

  if (isHigh && (isUnapproved || hasFollowUpDue)) {
    return 'A — Act Today';
  }

  if (
    lead.qualification === 'MEDIUM' ||
    (lead.missing_information && lead.missing_information.length > 0) ||
    lead.status === 'PENDING_APPROVAL'
  ) {
    return 'B — Review & Scope';
  }

  return 'C — Low / Dormant';
}

/**
 * Formats a human-readable response status.
 */
export function formatResponseStatus(status?: string): string {
  switch (status) {
    case 'replied':
      return 'Replied';
    case 'no_response':
      return 'No Response';
    case 'waiting':
    default:
      return 'Waiting for Response';
  }
}

/**
 * Formats currency/budget into a clean string.
 */
export function formatBudget(budget: number | null | undefined, currency: string = 'USD'): string {
  if (budget === null || budget === undefined || isNaN(Number(budget))) {
    return 'Not specified';
  }
  return `$${Number(budget).toLocaleString('en-US')} ${currency}`;
}

/**
 * Formats date string into readable local format.
 */
export function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

export interface WorkbookBuildOptions {
  scopeName?: string;
  exportDate?: Date;
}

/**
 * Builds a complete, multi-sheet XLSX Workbook object from CRM data.
 */
export function buildCrmWorkbook(
  leads: Lead[],
  followUps: FollowUp[] = [],
  options: WorkbookBuildOptions = {}
): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();
  const exportDate = options.exportDate || new Date();
  const scopeName = options.scopeName || 'All Leads';

  // ==========================================
  // SHEET 1: CRM Leads
  // ==========================================
  const leadHeaders = [
    'Lead Name',
    'Email',
    'Company',
    'Service',
    'Budget',
    'Currency',
    'Timeline',
    'Score',
    'Qualification',
    'Priority Tier',
    'Intent',
    'Urgency',
    'Response Status',
    'Follow-Up Count',
    'Next Follow-Up',
    'Last Contacted',
    'AI Summary',
    'Recommended Action',
    'Source',
    'Created Date',
  ];

  const leadRows = leads.map((lead) => [
    lead.name || '—',
    lead.email || '—',
    lead.company || '—',
    lead.service || 'General Inquiry',
    formatBudget(lead.budget, lead.currency),
    lead.currency || 'USD',
    lead.timeline || 'Flexible',
    lead.ai_score ?? '—',
    lead.qualification || 'LOW',
    getLeadPriorityLabel(lead),
    lead.intent || 'Medium',
    lead.urgency || 'Medium',
    formatResponseStatus(lead.response_status),
    lead.follow_up_count ?? 0,
    formatDate(lead.next_follow_up_at),
    formatDate(lead.last_contacted_at),
    lead.ai_summary || '—',
    lead.recommended_action || '—',
    lead.source || 'form',
    formatDate(lead.created_at),
  ]);

  const leadsData = [leadHeaders, ...(leadRows.length > 0 ? leadRows : [['No leads found', ...Array(19).fill('')]])];
  const wsLeads = XLSX.utils.aoa_to_sheet(leadsData);

  // Column widths for CRM Leads
  wsLeads['!cols'] = [
    { wch: 22 }, // Lead Name
    { wch: 28 }, // Email
    { wch: 22 }, // Company
    { wch: 24 }, // Service
    { wch: 16 }, // Budget
    { wch: 10 }, // Currency
    { wch: 18 }, // Timeline
    { wch: 10 }, // Score
    { wch: 15 }, // Qualification
    { wch: 24 }, // Priority Tier
    { wch: 12 }, // Intent
    { wch: 12 }, // Urgency
    { wch: 22 }, // Response Status
    { wch: 16 }, // Follow-Up Count
    { wch: 22 }, // Next Follow-Up
    { wch: 22 }, // Last Contacted
    { wch: 45 }, // AI Summary
    { wch: 40 }, // Recommended Action
    { wch: 12 }, // Source
    { wch: 22 }, // Created Date
  ];

  if (leadRows.length > 0) {
    wsLeads['!autofilter'] = {
      ref: `A1:T${leadRows.length + 1}`,
    };
  }

  XLSX.utils.book_append_sheet(wb, wsLeads, 'CRM Leads');

  // ==========================================
  // SHEET 2: Follow-Ups
  // ==========================================
  const followUpHeaders = [
    'Lead Name',
    'Company',
    'Follow-Up #',
    'Scheduled For',
    'Status',
    'Reason',
    'Created At',
    'Completed At',
  ];

  // Map follow-up rows joining lead details if available
  const leadMap = new Map<string, Lead>();
  leads.forEach((l) => leadMap.set(l.id, l));

  const followUpRows = followUps.map((fu) => {
    const parentLead = leadMap.get(fu.lead_id);
    return [
      parentLead?.name || '—',
      parentLead?.company || '—',
      `Follow-up #${fu.follow_up_number}`,
      formatDate(fu.scheduled_for),
      fu.status || 'SCHEDULED',
      fu.reason || '—',
      formatDate(fu.created_at),
      formatDate(fu.completed_at),
    ];
  });

  const followUpsData = [
    followUpHeaders,
    ...(followUpRows.length > 0
      ? followUpRows
      : [['No follow-up records recorded yet.', ...Array(7).fill('')]]),
  ];
  const wsFollowUps = XLSX.utils.aoa_to_sheet(followUpsData);

  wsFollowUps['!cols'] = [
    { wch: 22 }, // Lead Name
    { wch: 22 }, // Company
    { wch: 16 }, // Follow-Up #
    { wch: 22 }, // Scheduled For
    { wch: 16 }, // Status
    { wch: 35 }, // Reason
    { wch: 22 }, // Created At
    { wch: 22 }, // Completed At
  ];

  if (followUpRows.length > 0) {
    wsFollowUps['!autofilter'] = {
      ref: `A1:H${followUpRows.length + 1}`,
    };
  }

  XLSX.utils.book_append_sheet(wb, wsFollowUps, 'Follow-Ups');

  // ==========================================
  // SHEET 3: Summary
  // ==========================================
  const totalLeads = leads.length;
  const highTierCount = leads.filter((l) => l.qualification === 'HIGH').length;
  const mediumTierCount = leads.filter((l) => l.qualification === 'MEDIUM').length;
  const lowTierCount = leads.filter((l) => l.qualification === 'LOW').length;

  const repliedCount = leads.filter((l) => l.response_status === 'replied').length;
  const noResponseCount = leads.filter((l) => l.response_status === 'no_response').length;
  const waitingCount = leads.filter((l) => !l.response_status || l.response_status === 'waiting').length;

  const actTodayCount = leads.filter((l) => getLeadPriorityLabel(l) === 'A — Act Today').length;
  const reviewScopeCount = leads.filter((l) => getLeadPriorityLabel(l) === 'B — Review & Scope').length;
  const lowDormantCount = leads.filter((l) => getLeadPriorityLabel(l) === 'C — Low / Dormant').length;

  const scheduledFollowUpsCount = followUps.filter((f) => f.status === 'SCHEDULED').length;

  const summaryData = [
    ['LeadFlow AI — CRM Intelligence Export', ''],
    ['Agency Context', 'Northstar Studio (US)'],
    ['Export Date', formatDate(exportDate.toISOString())],
    ['Export Scope', scopeName],
    ['', ''],
    ['--- PIPELINE VOLUME ---', ''],
    ['Total Inbound Leads', totalLeads],
    ['High Qualification Tier', highTierCount],
    ['Medium Qualification Tier', mediumTierCount],
    ['Low Qualification Tier', lowTierCount],
    ['', ''],
    ['--- OPERATIONAL ACTION MATRIX ---', ''],
    ['Priority A — Act / Follow Up Today', actTodayCount],
    ['Needs Response Review (Replied)', repliedCount],
    ['Priority B — Review & Scope', reviewScopeCount],
    ['Priority C — Low / Dormant', lowDormantCount],
    ['', ''],
    ['--- RESPONSE & FOLLOW-UP STATUS ---', ''],
    ['Waiting for Response', waitingCount],
    ['Prospect Replied (Follow-ups Paused)', repliedCount],
    ['No Response Recorded', noResponseCount],
    ['Follow-Ups Scheduled', scheduledFollowUpsCount],
    ['Total Follow-Up Records', followUps.length],
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  wsSummary['!cols'] = [{ wch: 38 }, { wch: 30 }];

  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

  return wb;
}

/**
 * Generates an Excel binary buffer (Uint8Array / Buffer) from CRM data.
 */
export function generateCrmExcelBuffer(
  leads: Lead[],
  followUps: FollowUp[] = [],
  options: WorkbookBuildOptions = {}
): Buffer {
  const wb = buildCrmWorkbook(leads, followUps, options);
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}
