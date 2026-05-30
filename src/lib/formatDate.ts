export function formatToIST(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const hasTime = dateStr.includes("T") || /\d{2}:\d{2}/.test(dateStr);
    // If the incoming string has no time, treat it as UTC date boundary
    const normalized = hasTime ? dateStr : `${dateStr}T00:00:00Z`;
    const d = new Date(normalized);
    const options: Intl.DateTimeFormatOptions = {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: hasTime ? "2-digit" : undefined,
      minute: hasTime ? "2-digit" : undefined,
      hour12: true,
    };
    const formatted = new Intl.DateTimeFormat("en-GB", options).format(d);
    return hasTime ? `${formatted} IST` : formatted;
  } catch (e) {
    return dateStr;
  }
}
