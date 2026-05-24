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
    // Try parsing as ISO format first (with T separator)
    if (dateInput.includes('T')) {
      date = new Date(dateInput);
    }
    // If it's a database format (YYYY-MM-DD HH:mm:ss), treat as UTC
    else if (dateInput.includes('-') && dateInput.includes(':')) {
      date = new Date(dateInput.replace(' ', 'T') + 'Z');
    }
    // Otherwise try as-is
    else {
      date = new Date(dateInput);
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

  // Format using browser's local time with consistent 'en-US' locale
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}
