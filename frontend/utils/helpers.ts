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