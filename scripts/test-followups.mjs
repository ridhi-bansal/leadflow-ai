import assert from 'node:assert';

/**
 * Pure JS test for deterministic follow-up logic matching lib/followups/index.ts
 */
function addBusinessDays(startDate, businessDays) {
  const result = new Date(startDate);
  let daysAdded = 0;

  while (result.getDay() === 0 || result.getDay() === 6) {
    result.setDate(result.getDate() + 1);
  }

  while (daysAdded < businessDays) {
    result.setDate(result.getDate() + 1);
    const dayOfWeek = result.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      daysAdded++;
    }
  }

  return result;
}

function formatBusinessDate(date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

function getFollowUpRecommendation(lead, communications = [], currentDate = new Date()) {
  if (lead.response_status === 'replied') {
    return {
      shouldFollowUp: false,
      followUpNumber: null,
      recommendedDate: null,
      recommendedDateFormatted: null,
      reason: 'Lead replied to agency outreach.',
      nextAction: 'Review the conversation and schedule a discovery call or move forward.',
      isDue: false,
      status: 'PAUSED_REPLIED',
    };
  }

  const initialComm = communications.find(
    (c) => c.type === 'initial_reply' && (c.status === 'APPROVED' || c.status === 'SENT')
  );

  if (!initialComm) {
    return {
      shouldFollowUp: false,
      followUpNumber: null,
      recommendedDate: null,
      recommendedDateFormatted: null,
      reason: 'Initial outreach email has not yet been approved.',
      nextAction: 'Review, edit, and approve the initial reply draft.',
      isDue: false,
      status: 'PENDING_INITIAL',
    };
  }

  const followUp1Comm = communications.find(
    (c) => c.type === 'follow_up_1' && (c.status === 'APPROVED' || c.status === 'SENT')
  );

  const followUp2Comm = communications.find(
    (c) => c.type === 'follow_up_2' && (c.status === 'APPROVED' || c.status === 'SENT')
  );

  if (followUp2Comm) {
    return {
      shouldFollowUp: false,
      followUpNumber: null,
      recommendedDate: null,
      recommendedDateFormatted: null,
      reason: 'No response received after 2 follow-ups. Automated recommendations stopped.',
      nextAction: 'Archive inquiry or mark lead as Dormant / Closed.',
      isDue: false,
      status: 'STOPPED_MAX',
    };
  }

  if (followUp1Comm) {
    const refDateStr = followUp1Comm.approved_at || followUp1Comm.created_at;
    const refDate = refDateStr ? new Date(refDateStr) : new Date(lead.updated_at);
    const recommendedDate = addBusinessDays(refDate, 4);
    const isDue =
      currentDate.setHours(0, 0, 0, 0) >= new Date(recommendedDate).setHours(0, 0, 0, 0);

    return {
      shouldFollowUp: true,
      followUpNumber: 2,
      recommendedDate: recommendedDate.toISOString(),
      recommendedDateFormatted: formatBusinessDate(recommendedDate),
      reason: 'No response after Follow-up #1.',
      nextAction: 'Send Follow-up #2 (final check-in to close the loop).',
      isDue,
      status: isDue ? 'DUE' : 'UPCOMING',
    };
  }

  const refDateStr = initialComm.approved_at || initialComm.created_at;
  const refDate = refDateStr ? new Date(refDateStr) : new Date(lead.created_at);
  const recommendedDate = addBusinessDays(refDate, 2);
  const isDue =
    currentDate.setHours(0, 0, 0, 0) >= new Date(recommendedDate).setHours(0, 0, 0, 0);

  return {
    shouldFollowUp: true,
    followUpNumber: 1,
    recommendedDate: recommendedDate.toISOString(),
    recommendedDateFormatted: formatBusinessDate(recommendedDate),
    reason: 'No response after initial outreach.',
    nextAction: 'Send Follow-up #1 (brief check-in on project timeline).',
    isDue,
    status: isDue ? 'DUE' : 'UPCOMING',
  };
}

console.log('--- RUNNING DETERMINISTIC FOLLOW-UP TESTS ---');

// Test 1: Friday + 2 business days = Tuesday
const friday = new Date('2026-10-02T10:00:00Z');
const tuesday2Days = addBusinessDays(friday, 2);
console.log(`Test 1: Friday + 2 business days -> ${formatBusinessDate(tuesday2Days)} (Day of week: ${tuesday2Days.getDay()})`);
assert.strictEqual(tuesday2Days.getDay(), 2, 'Friday + 2 business days must be a Tuesday');

// Test 2: Wednesday + 4 business days = Tuesday
const wednesday = new Date('2026-10-07T10:00:00Z');
const tuesday4Days = addBusinessDays(wednesday, 4);
console.log(`Test 2: Wednesday + 4 business days -> ${formatBusinessDate(tuesday4Days)} (Day of week: ${tuesday4Days.getDay()})`);
assert.strictEqual(tuesday4Days.getDay(), 2, 'Wednesday + 4 business days must be a Tuesday');

// Test 3: Replied lead -> Paused
const mockLead = {
  id: 'lead-1',
  name: 'Sarah Mitchell',
  response_status: 'replied',
  created_at: '2026-10-01T10:00:00Z',
  updated_at: '2026-10-01T10:00:00Z',
};

const recReplied = getFollowUpRecommendation(mockLead, [
  { type: 'initial_reply', status: 'APPROVED', created_at: '2026-10-01T10:00:00Z', approved_at: '2026-10-01T10:00:00Z' },
]);
console.log(`Test 3: Replied lead status -> ${recReplied.status}, shouldFollowUp: ${recReplied.shouldFollowUp}`);
assert.strictEqual(recReplied.shouldFollowUp, false);
assert.strictEqual(recReplied.status, 'PAUSED_REPLIED');

// Test 4: Waiting + initial outreach -> Follow-up #1
mockLead.response_status = 'waiting';
const rec1 = getFollowUpRecommendation(mockLead, [
  { type: 'initial_reply', status: 'APPROVED', created_at: '2026-10-02T10:00:00Z', approved_at: '2026-10-02T10:00:00Z' },
], new Date('2026-10-03T10:00:00Z'));
console.log(`Test 4: Follow-up #1 recommendation -> #${rec1.followUpNumber}, due date: ${rec1.recommendedDateFormatted}`);
assert.strictEqual(rec1.shouldFollowUp, true);
assert.strictEqual(rec1.followUpNumber, 1);

// Test 5: Follow-up #1 approved -> Follow-up #2
const rec2 = getFollowUpRecommendation(mockLead, [
  { type: 'initial_reply', status: 'APPROVED', created_at: '2026-10-02T10:00:00Z', approved_at: '2026-10-02T10:00:00Z' },
  { type: 'follow_up_1', status: 'APPROVED', created_at: '2026-10-06T10:00:00Z', approved_at: '2026-10-06T10:00:00Z' },
], new Date('2026-10-07T10:00:00Z'));
console.log(`Test 5: Follow-up #2 recommendation -> #${rec2.followUpNumber}, due date: ${rec2.recommendedDateFormatted}`);
assert.strictEqual(rec2.shouldFollowUp, true);
assert.strictEqual(rec2.followUpNumber, 2);

// Test 6: Follow-up #2 approved -> Stopped
const recStopped = getFollowUpRecommendation(mockLead, [
  { type: 'initial_reply', status: 'APPROVED', created_at: '2026-10-02T10:00:00Z', approved_at: '2026-10-02T10:00:00Z' },
  { type: 'follow_up_1', status: 'APPROVED', created_at: '2026-10-06T10:00:00Z', approved_at: '2026-10-06T10:00:00Z' },
  { type: 'follow_up_2', status: 'APPROVED', created_at: '2026-10-12T10:00:00Z', approved_at: '2026-10-12T10:00:00Z' },
]);
console.log(`Test 6: Max follow-ups reached -> status: ${recStopped.status}, shouldFollowUp: ${recStopped.shouldFollowUp}`);
assert.strictEqual(recStopped.shouldFollowUp, false);
assert.strictEqual(recStopped.status, 'STOPPED_MAX');

console.log('✅ ALL DETERMINISTIC FOLLOW-UP TESTS PASSED WITH 100% ACCURACY!');
