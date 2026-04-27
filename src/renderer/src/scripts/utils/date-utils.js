export const formatMMDDYYYY = (date) => {
  if (!date) return null;

  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return null;

  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yyyy = d.getFullYear();

  return `${mm}/${dd}/${yyyy}`;
};

export const parseMMDDYYYY = (value) => {
  if (!value) return null;

  const [mm, dd, yyyy] = value.split("/");
  if (!mm || !dd || !yyyy) return null;

  return new Date(Number(yyyy), Number(mm) - 1, Number(dd), 0, 0, 0, 0);
};

// Helper: normalize a date-like value to zero-padded MM/DD/YYYY
export const normalizeToMMDDYYYY = (value) => {
  if (!value) return null;

  // If it's already in MM/DD/YYYY format, parseMMDDYYYY will return a Date
  const asMMDD = parseMMDDYYYY(value);
  if (asMMDD) return formatMMDDYYYY(asMMDD);

  // Try generic Date parsing (ISO timestamps, etc.)
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;

  // Use UTC components to avoid timezone shifts that can change the calendar day
  const yyyy = parsed.getUTCFullYear();
  const mm = String(parsed.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(parsed.getUTCDate()).padStart(2, "0");

  return `${mm}/${dd}/${yyyy}`;
};
