import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatLocalTime(dateInput) {
  if (!dateInput) return 'N/A';

  let date;

  // Handle Unix timestamp (number)
  if (typeof dateInput === 'number') {
    // Check if it's in seconds or milliseconds
    date = dateInput < 10000000000 ? new Date(dateInput * 1000) : new Date(dateInput);
  }
  // Handle date string
  else if (typeof dateInput === 'string') {
    // Try parsing as-is first
    date = new Date(dateInput);

    // If that fails, try with UTC suffix
    if (isNaN(date.getTime())) {
      date = new Date(dateInput + ' UTC');
    }

    // If still fails, try replacing space with T
    if (isNaN(date.getTime())) {
      date = new Date(dateInput.replace(' ', 'T'));
    }

    // If still fails, try with Z
    if (isNaN(date.getTime())) {
      date = new Date(dateInput.replace(' ', 'T') + 'Z');
    }
  }
  // Handle Date object directly
  else if (dateInput instanceof Date) {
    date = dateInput;
  }
  else {
    return 'N/A';
  }

  // Check if date is valid
  if (isNaN(date.getTime())) {
    return 'N/A';
  }

  try {
    const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: userTimeZone
    });
  } catch (err) {
    // Fallback if timezone fails
    try {
      return date.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (err2) {
      return date.toString();
    }
  }
}
