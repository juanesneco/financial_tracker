import { format, isToday, isYesterday } from "date-fns";
import { es } from "date-fns/locale";

export function formatCurrency(amount: number, currency: string = "MXN"): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatCurrencyUSD(amount: number): string {
  return formatCurrency(amount, "USD");
}

/**
 * Format amount with dual currency display when applicable.
 * E.g., "$1,234.00 MXN" or "$50.00 USD"
 */
export function formatTransactionAmount(amount: number, currency: string = "MXN"): string {
  const formatted = formatCurrency(amount, currency);
  return currency !== "MXN" ? `${formatted} ${currency}` : formatted;
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString + "T00:00:00");
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMM d, yyyy", { locale: es });
}

export function formatDateShort(dateString: string): string {
  const date = new Date(dateString + "T00:00:00");
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMM d");
}

export function formatMonthYear(month: number, year: number): string {
  const date = new Date(year, month, 1);
  return format(date, "MMMM yyyy");
}

export function getMonthDateRange(month: number, year: number) {
  const start = format(new Date(year, month, 1), "yyyy-MM-dd");
  const end = format(new Date(year, month + 1, 0), "yyyy-MM-dd");
  return { start, end };
}
