export type ExpertCategory =
  | 'Tech & AI'
  | 'Legal & Immigration'
  | 'Startup & VC'
  | 'Tax & Accounting'
  | 'Product & UX'
  | 'Career Coaching';

export interface TimeSlot {
  id: string;
  expertId: string;
  startTime: string; // ISO 8601 UTC string
  endTime: string;   // ISO 8601 UTC string
  durationMinutes: number;
  status: 'available' | 'booked' | 'held';
}

export interface Expert {
  id: string;
  name: string;
  title: string;
  company: string;
  avatarUrl: string;
  category: ExpertCategory;
  bio: string;
  rating: number;
  reviewCount: number;
  ratePerSessionCents: number; // Stored in integer cents ($150.00 = 15000)
  currency: string;
  timezone: string;
  timezoneOffsetHours: number;
  languages: string[];
  yearsExperience: number;
  topics: string[];
}

export interface BookingUser {
  name: string;
  email: string;
  timezone: string;
  notes?: string;
  phone?: string;
}

export interface Booking {
  id: string;
  confirmationCode: string;
  expertId: string;
  expert: {
    id: string;
    name: string;
    title: string;
    avatarUrl: string;
    category: ExpertCategory;
    timezone: string;
  };
  slotId: string;
  slot: {
    id: string;
    startTime: string;
    endTime: string;
    durationMinutes: number;
  };
  user: BookingUser;
  totalAmountCents: number;
  currency: string;
  status: 'confirmed' | 'completed' | 'cancelled';
  createdAt: string;
  meetingUrl: string;
  idempotencyKey?: string;
}

export interface CreateBookingPayload {
  expertId: string;
  slotId: string;
  user: BookingUser;
  idempotencyKey?: string;
}
