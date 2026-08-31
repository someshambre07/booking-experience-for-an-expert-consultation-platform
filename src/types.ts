export type ExpertCategory =
  | 'All'
  | 'Tech & AI'
  | 'Legal & Immigration'
  | 'Startup & VC'
  | 'Tax & Accounting'
  | 'Product & UX'
  | 'Career Coaching';

export interface TimeSlot {
  id: string;
  expertId: string;
  startTime: string; // ISO UTC string, e.g. "2026-08-31T14:30:00.000Z"
  endTime: string;   // ISO UTC string, e.g. "2026-08-31T15:00:00.000Z"
  durationMinutes: number; // 30
  status: 'available' | 'booked' | 'held';
  isAvailableNow?: boolean; // True if slot starts within next 30 minutes
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
  ratePerSessionCents: number; // integer cents (e.g. 12000 = $120.00)
  currency: string; // "USD", "EUR", "GBP"
  timezone: string; // e.g. "America/New_York", "Europe/London", "Asia/Tokyo"
  timezoneOffsetHours: number; // UTC offset in hours
  languages: string[];
  yearsExperience: number;
  topics: string[];
  slots?: TimeSlot[];
  nextAvailableSlot?: TimeSlot | null;
  isAvailableRightNow?: boolean;
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

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: Record<string, any>;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface FilterState {
  search: string;
  category: ExpertCategory;
  availableNowOnly: boolean;
  sortBy: 'recommended' | 'price_asc' | 'price_desc' | 'rating' | 'experience';
  userTimezone: string;
}
