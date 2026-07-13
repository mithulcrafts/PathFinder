import { TimelineEvent } from '../types/schema';

/**
 * Extracts exactly 4 (or fewer) key milestones from a user's full timeline
 * for the horizontal mini-timeline UI on the Results Card.
 */
export function extractKeyMilestones(timeline: TimelineEvent[]): TimelineEvent[] {
  if (!timeline || timeline.length === 0) return [];
  if (timeline.length <= 4) return timeline;

  const startNode = timeline[0];
  const endNode = timeline[timeline.length - 1];
  const middleEvents = timeline.slice(1, timeline.length - 1);

  // Prefer nodes with explicit transitions (decision points)
  const decisionNodes = middleEvents.filter(
    ev => ev.expandedDetails?.transitions?.length > 0
  );

  let selected: TimelineEvent[];

  if (decisionNodes.length >= 2) {
    selected = [decisionNodes[0], decisionNodes[decisionNodes.length - 1]];
  } else if (decisionNodes.length === 1) {
    const otherIdx = Math.floor(middleEvents.length / 2);
    const other = middleEvents[otherIdx] === decisionNodes[0]
      ? middleEvents[Math.min(otherIdx + 1, middleEvents.length - 1)]
      : middleEvents[otherIdx];
    selected = [decisionNodes[0], other];
  } else {
    const step = Math.floor(middleEvents.length / 3);
    selected = [middleEvents[step], middleEvents[step * 2]];
  }

  // Dedupe by id
  const seen = new Map<string, TimelineEvent>();
  [startNode, selected[0], selected[1], endNode].forEach(n => {
    if (n?.id) seen.set(n.id, n);
  });

  return Array.from(seen.values());
}

export function calculateDuration(startDateStr: string, endDateStr?: string | null): string {
  const start = new Date(startDateStr);
  // If there's an endDate, use it. Otherwise, use the current system date.
  const end = endDateStr ? new Date(endDateStr) : new Date();

  // Calculate the raw difference in milliseconds
  const diffTime = end.getTime() - start.getTime();
  
  // If the date calculation ends up negative due to timezone anomalies, default to 0 days
  const totalDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

  // 1. Less than a month (approx. 30 days) -> Show in days
  if (totalDays < 30) {
    return `${totalDays} ${totalDays === 1 ? 'Day' : 'Days'}`;
  }

  // Calculate rough year and month differences
  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth() + (years * 12);

  // Adjust month count if the end day of the month hasn't reached the start day yet
  if (end.getDate() < start.getDate()) {
    months--;
  }

  // 2. Greater than or equal to a year (12 months) -> Show only in years
  if (months >= 12) {
    const totalYears = Math.floor(months / 12);
    return `${totalYears} ${totalYears === 1 ? 'Year' : 'Years'}`;
  }

  // 3. Greater than a month but less than a year -> Show only in months
  return `${months} ${months === 1 ? 'Month' : 'Months'}`;
}


export function formatToMonthYear(dateStr: string | null | undefined): string {
  if (!dateStr) return "Present";
  const parts = dateStr.split("-");
  if (parts.length < 2) return dateStr;
  const year = parts[0];
  const monthIndex = Number(parts[1]) - 1;
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  const month = months[monthIndex];
  return month ? `${month}-${year}` : dateStr;
}