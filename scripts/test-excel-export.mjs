import assert from 'node:assert';
import * as XLSX from 'xlsx';
import { buildCrmWorkbook, generateCrmExcelBuffer, getLeadPriorityLabel } from '../lib/export/excel.ts';

console.log('--- RUNNING EXCEL CRM EXPORT UNIT TESTS ---');

// Mock data
const mockLeads = [
  {
    id: 'lead-1',
    name: 'Sarah Mitchell',
    email: 'sarah@oakandthread.com',
    company: 'Oak & Thread Apparel',
    service: 'Website Development',
    budget: 8000,
    currency: 'USD',
    timeline: 'Within 1 month',
    ai_score: 100,
    qualification: 'HIGH',
    intent: 'High',
    urgency: 'High',
    ai_summary: 'E-commerce website project for sustainable apparel brand.',
    recommended_action: 'Schedule discovery call.',
    status: 'APPROVED',
    response_status: 'no_response',
    follow_up_count: 1,
    next_follow_up_at: '2026-10-08T10:00:00Z',
    last_contacted_at: '2026-10-06T10:00:00Z',
    source: 'email',
    created_at: '2026-10-05T10:00:00Z',
    updated_at: '2026-10-06T10:00:00Z',
  },
  {
    id: 'lead-2',
    name: 'Olivia Reed',
    email: 'olivia@willowandco.com',
    company: 'Willow & Co.',
    service: 'Branding & Design',
    budget: null,
    currency: 'USD',
    timeline: 'Flexible',
    ai_score: 65,
    qualification: 'MEDIUM',
    intent: 'Medium',
    urgency: 'Medium',
    ai_summary: 'Branding project with unspecified budget.',
    recommended_action: 'Clarify project budget and scope.',
    status: 'PENDING_APPROVAL',
    response_status: 'waiting',
    follow_up_count: 0,
    next_follow_up_at: null,
    last_contacted_at: null,
    source: 'form',
    created_at: '2026-10-05T11:00:00Z',
    updated_at: '2026-10-05T11:00:00Z',
  },
  {
    id: 'lead-3',
    name: 'Daniel Hayes',
    email: 'daniel@example.com',
    company: null,
    service: 'Other',
    budget: 500,
    currency: 'USD',
    timeline: 'Not decided',
    ai_score: 25,
    qualification: 'LOW',
    intent: 'Low',
    urgency: 'Low',
    ai_summary: 'Casual inquiry.',
    recommended_action: 'Gather more information.',
    status: 'AI_ANALYZED',
    response_status: 'replied',
    follow_up_count: 0,
    next_follow_up_at: null,
    last_contacted_at: null,
    source: 'form',
    created_at: '2026-10-05T12:00:00Z',
    updated_at: '2026-10-05T12:00:00Z',
  },
];

const mockFollowUps = [
  {
    id: 'fu-1',
    lead_id: 'lead-1',
    follow_up_number: 1,
    scheduled_for: '2026-10-08T10:00:00Z',
    status: 'SCHEDULED',
    reason: 'No response after initial outreach',
    created_at: '2026-10-06T10:00:00Z',
    completed_at: null,
  },
];

// Test 1: Workbook creation & Sheet names
const wb = buildCrmWorkbook(mockLeads, mockFollowUps, { scopeName: 'Test Export' });
assert.ok(wb, 'Workbook must be created');
assert.deepStrictEqual(wb.SheetNames, ['CRM Leads', 'Follow-Ups', 'Summary'], 'Workbook must contain exact 3 expected sheets');
console.log('✓ Sheet names verified:', wb.SheetNames.join(', '));

// Test 2: CRM Leads Sheet headers and row count
const wsLeads = wb.Sheets['CRM Leads'];
const leadsJson = XLSX.utils.sheet_to_json(wsLeads, { header: 1 });
const expectedLeadHeaders = [
  'Lead Name', 'Email', 'Company', 'Service', 'Budget', 'Currency', 'Timeline',
  'Score', 'Qualification', 'Priority Tier', 'Intent', 'Urgency', 'Response Status',
  'Follow-Up Count', 'Next Follow-Up', 'Last Contacted', 'AI Summary', 'Recommended Action',
  'Source', 'Created Date'
];
assert.deepStrictEqual(leadsJson[0], expectedLeadHeaders, 'CRM Leads headers must match specification');
assert.strictEqual(leadsJson.length, 4, 'CRM Leads must have header + 3 data rows');
console.log('✓ CRM Leads headers and rows verified.');

// Test 3: Follow-Ups Sheet headers and content
const wsFollowUps = wb.Sheets['Follow-Ups'];
const followUpsJson = XLSX.utils.sheet_to_json(wsFollowUps, { header: 1 });
const expectedFuHeaders = [
  'Lead Name', 'Company', 'Follow-Up #', 'Scheduled For', 'Status', 'Reason', 'Created At', 'Completed At'
];
assert.deepStrictEqual(followUpsJson[0], expectedFuHeaders, 'Follow-Ups headers must match specification');
assert.strictEqual(followUpsJson[1][0], 'Sarah Mitchell', 'Follow-Up row must link parent lead name');
assert.strictEqual(followUpsJson[1][2], 'Follow-up #1', 'Follow-Up number formatted correctly');
console.log('✓ Follow-Ups sheet verified.');

// Test 4: Summary Sheet calculations
const wsSummary = wb.Sheets['Summary'];
const summaryJson = XLSX.utils.sheet_to_json(wsSummary, { header: 1 });
const summaryMap = Object.fromEntries(summaryJson.filter((r) => r.length === 2 && r[0]));

assert.strictEqual(summaryMap['Total Inbound Leads'], 3, 'Total leads count in summary must be 3');
assert.strictEqual(summaryMap['High Qualification Tier'], 1, 'High tier count must be 1');
assert.strictEqual(summaryMap['Medium Qualification Tier'], 1, 'Medium tier count must be 1');
assert.strictEqual(summaryMap['Low Qualification Tier'], 1, 'Low tier count must be 1');
assert.strictEqual(summaryMap['Priority A — Act / Follow Up Today'], 1, 'Priority A count must be 1');
assert.strictEqual(summaryMap['Needs Response Review (Replied)'], 1, 'Replied count must be 1');
assert.strictEqual(summaryMap['Priority B — Review & Scope'], 1, 'Priority B count must be 1');
console.log('✓ Summary calculations verified.');

// Test 5: Empty state handling
const emptyWb = buildCrmWorkbook([], [], { scopeName: 'Empty Export' });
assert.deepStrictEqual(emptyWb.SheetNames, ['CRM Leads', 'Follow-Ups', 'Summary'], 'Empty workbook must still contain all 3 sheets');
const emptyLeadsJson = XLSX.utils.sheet_to_json(emptyWb.Sheets['CRM Leads'], { header: 1 });
assert.strictEqual(emptyLeadsJson[1][0], 'No leads found', 'Empty state row displayed on leads sheet');
const emptyFuJson = XLSX.utils.sheet_to_json(emptyWb.Sheets['Follow-Ups'], { header: 1 });
assert.strictEqual(emptyFuJson[1][0], 'No follow-up records recorded yet.', 'Empty state row displayed on follow-ups sheet');
console.log('✓ Empty states verified.');

// Test 6: Binary Buffer Generation
const buffer = generateCrmExcelBuffer(mockLeads, mockFollowUps);
assert.ok(buffer instanceof Uint8Array || Buffer.isBuffer(buffer), 'Buffer must be a valid binary array');
assert.ok(buffer.length > 1000, 'Excel buffer must have non-trivial size');
console.log(`✓ Binary buffer generated successfully (${buffer.length} bytes).`);

// Test 7: Priority Labels
assert.strictEqual(getLeadPriorityLabel(mockLeads[0]), 'A — Act Today');
assert.strictEqual(getLeadPriorityLabel(mockLeads[1]), 'B — Review & Scope');
assert.strictEqual(getLeadPriorityLabel(mockLeads[2]), 'Replied (Needs Review)');
console.log('✓ Priority labels match LeadFlow operational engine.');

console.log('\n🎉 ALL EXCEL CRM EXPORT TESTS PASSED SUCCESSFULLY!');
