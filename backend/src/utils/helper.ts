export function toNeo4jDate(
  dateText: string
): string {

  const match =
    dateText.match(/^(\d{2})\s+(\d{4})$/);

  if (!match) {
    throw new Error(
      `Invalid date: ${dateText}`
    );
  }

  const month = parseInt(match[1]!, 10);
  if (month < 1 || month > 12) {
    throw new Error(`Invalid month: ${match[1]}`);
  }

  return `${match[2]}-${String(month).padStart(
    2,
    "0"
  )}-01`;
}