import { Booking } from '../types.js';

export function formatCentsToCurrency(cents: number, currency = 'USD'): string {
  const dollars = cents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(dollars);
}

export function formatSlotTime(isoString: string, timezone: string): string {
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: timezone || 'UTC',
    }).format(date);
  } catch (e) {
    return isoString;
  }
}

export function formatSlotDate(isoString: string, timezone: string): string {
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      timeZone: timezone || 'UTC',
    }).format(date);
  } catch (e) {
    return isoString;
  }
}

export function formatFullDateTime(isoString: string, timezone: string): string {
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: timezone || 'UTC',
      timeZoneName: 'short',
    }).format(date);
  } catch (e) {
    return isoString;
  }
}

export function getMinutesUntil(isoString: string): number {
  const diffMs = new Date(isoString).getTime() - Date.now();
  return Math.round(diffMs / (60 * 1000));
}

export function formatRelativeStartsIn(isoString: string): string {
  const mins = getMinutesUntil(isoString);
  if (mins <= 0 && mins >= -30) {
    return 'In Session Right Now';
  }
  if (mins < -30) {
    return 'Completed';
  }
  if (mins < 60) {
    return `Starts in ${mins} min${mins === 1 ? '' : 's'}`;
  }
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  if (hours < 24) {
    return `Starts in ${hours}h ${remMins > 0 ? `${remMins}m` : ''}`;
  }
  const days = Math.floor(hours / 24);
  return `In ${days} day${days === 1 ? '' : 's'}`;
}

export function generateIcsCalendar(booking: Booking): string {
  const start = new Date(booking.slot.startTime);
  const end = new Date(booking.slot.endTime);

  const formatIcsDate = (d: Date) =>
    d.toISOString().replace(/-|:|\.\d+/g, '');

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Consult Expert Advisory//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:booking-${booking.id}@consult.app`,
    `DTSTAMP:${formatIcsDate(new Date())}`,
    `DTSTART:${formatIcsDate(start)}`,
    `DTEND:${formatIcsDate(end)}`,
    `SUMMARY:Consultation with ${booking.expert.name} (${booking.confirmationCode})`,
    `DESCRIPTION:Expert Consultation with ${booking.expert.name} (${booking.expert.title}).\\nMeeting Room: ${booking.meetingUrl}\\nConfirmation Code: ${booking.confirmationCode}`,
    `LOCATION:${booking.meetingUrl}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT15M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Reminder: Consultation starting in 15 minutes',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  return icsContent;
}

export function downloadIcsFile(booking: Booking) {
  const ics = generateIcsCalendar(booking);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `consultation-${booking.confirmationCode}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export const COMMON_TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (US / New York - EDT/EST)' },
  { value: 'America/Chicago', label: 'Central Time (US / Chicago - CDT/CST)' },
  { value: 'America/Denver', label: 'Mountain Time (US / Denver - MDT/MST)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US / SF & LA - PDT/PST)' },
  { value: 'Europe/London', label: 'London / GMT (UK - BST/GMT)' },
  { value: 'Europe/Paris', label: 'Central European Time (Paris, Berlin - CEST/CET)' },
  { value: 'Asia/Dubai', label: 'Gulf Standard Time (Dubai - GST)' },
  { value: 'Asia/Kolkata', label: 'India Standard Time (IST)' },
  { value: 'Asia/Singapore', label: 'Singapore Standard Time (SGT)' },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time (Tokyo - JST)' },
  { value: 'Australia/Sydney', label: 'Australian Eastern Time (Sydney - AEST)' },
  { value: 'UTC', label: 'Coordinated Universal Time (UTC)' },
];
