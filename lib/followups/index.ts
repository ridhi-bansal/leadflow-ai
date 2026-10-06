import { Communication, FollowUpRecommendation, Lead } from '@/types/lead';

/**
 * Adds business days (Monday to Friday) to a given start date.
 * Skips Saturdays and Sundays.
 *
 * Example:
 * - Friday + 2 business days -> Tuesday
 * - Wednesday + 4 business days -> Tuesday
 */
export function addBusinessDays(startDate: Date, businessDays: number): Date {
  const result = new Date(startDate);
  let daysAdded = 0;

  // If starting on a weekend, roll forward to the next business day first
  while (result.getDay() === 0 || result.getDay() === 6) {
    result.setDate(result.getDate() + 1);
  }

  while (daysAdded < businessDays) {
    result.setDate(result.getDate() + 1);
    const dayOfWeek = result.getDay();
    // 0 = Sunday, 6 = Saturday
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      daysAdded++;
    }
  }

  return result;
}

/**
 * Formats a Date object into a readable business date string.
 * Example: "Tuesday, Oct 8"
 */
export function formatBusinessDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Deterministically evaluates follow-up requirements and timing for a lead.
 *
 * Business Rules:
 * 1. Replied leads -> Stop follow-ups immediately (Status: PAUSED_REPLIED)
 * 2. Unapproved initial drafts -> Pending initial outreach (Status: PENDING_INITIAL)
 * 3. Initial email approved/sent + No response -> Follow-up #1 in 2 business days (Status: DUE or UPCOMING)
 * 4. Follow-up #1 approved/sent + No response -> Follow-up #2 in 4 business days (Status: DUE or UPCOMING)
 * 5. Follow-up #2 approved/sent + No response -> Stop recommendations (Status: STOPPED_MAX)
 */
export function getFollowUpRecommendation(
  lead: Lead,
  communications: Communication[] = [],
  currentDate: Date = new Date()
): FollowUpRecommendation {
  // 1. If lead is marked as REPLIED, immediately pause recommendations
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

  // 2. Identify communications history
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

  // 3. Evaluate based on completed follow-up tiers
  if (followUp2Comm) {
    // 2 Follow-ups already completed
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
    // Follow-up #1 completed -> Recommend Follow-up #2 in 4 business days
    const refDateStr = followUp1Comm.approved_at || followUp1Comm.created_at;
    const refDate = refDateStr ? new Date(refDateStr) : new Date(lead.updated_at);
    const recommendedDate = addBusinessDays(refDate, 4);

    // Normalize comparison to start of day
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

  // Initial email completed -> Recommend Follow-up #1 in 2 business days
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
