import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Replace Unicode smart quotes/dashes with ASCII equivalents */
export function normalizeQuotes(text: string): string {
  return text
    .replace(/[\u2018\u2019\u201A\u2032]/g, "'")   // smart single quotes → '
    .replace(/[\u201C\u201D\u201E\u2033]/g, '"')    // smart double quotes → "
    .replace(/[\u2013\u2014]/g, "-")                 // en/em dashes → -
    .replace(/\u2026/g, "...");                      // ellipsis → ...
}
