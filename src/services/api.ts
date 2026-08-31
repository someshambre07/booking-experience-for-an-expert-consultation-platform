import {
  ApiErrorResponse,
  ApiResponse,
  Booking,
  BookingUser,
  Expert,
  ExpertCategory,
  TimeSlot,
} from '../types.js';

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    try {
      const res = await fetch(endpoint, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        const errorData = (json as ApiErrorResponse).error || {
          code: 'UNKNOWN_ERROR',
          message: 'An unexpected error occurred',
        };
        const error: any = new Error(errorData.message);
        error.code = errorData.code;
        error.statusCode = res.status;
        error.details = errorData.details;
        throw error;
      }

      return json.data as T;
    } catch (err: any) {
      if (!window.navigator.onLine) {
        const offlineErr: any = new Error('You appear to be offline. Please check your internet connection.');
        offlineErr.code = 'OFFLINE';
        throw offlineErr;
      }
      throw err;
    }
  }

  public async getCategories(): Promise<{
    categories: Array<{ name: string; count: number }>;
    availableNowCount: number;
  }> {
    return this.request<{
      categories: Array<{ name: string; count: number }>;
      availableNowCount: number;
    }>('/api/categories');
  }

  public async getExperts(params: {
    category?: string;
    search?: string;
    availableNow?: boolean;
    sortBy?: string;
  }): Promise<Expert[]> {
    const query = new URLSearchParams();
    if (params.category && params.category !== 'All') query.set('category', params.category);
    if (params.search) query.set('search', params.search);
    if (params.availableNow) query.set('availableNow', 'true');
    if (params.sortBy) query.set('sortBy', params.sortBy);

    const queryString = query.toString();
    const endpoint = `/api/experts${queryString ? `?${queryString}` : ''}`;
    return this.request<Expert[]>(endpoint);
  }

  public async getExpertById(id: string): Promise<Expert & { slots: TimeSlot[]; isAvailableRightNow: boolean }> {
    return this.request<Expert & { slots: TimeSlot[]; isAvailableRightNow: boolean }>(`/api/experts/${id}`);
  }

  public async getSlots(expertId: string): Promise<TimeSlot[]> {
    return this.request<TimeSlot[]>(`/api/slots?expertId=${encodeURIComponent(expertId)}`);
  }

  public async createBooking(payload: {
    expertId: string;
    slotId: string;
    user: BookingUser;
    idempotencyKey: string;
  }): Promise<Booking> {
    return this.request<Booking>('/api/bookings', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async getBookings(email?: string): Promise<Booking[]> {
    const query = email ? `?email=${encodeURIComponent(email)}` : '';
    return this.request<Booking[]>(`/api/bookings${query}`);
  }

  public async getBookingById(id: string): Promise<Booking> {
    return this.request<Booking>(`/api/bookings/${id}`);
  }

  public async cancelBooking(id: string): Promise<Booking> {
    return this.request<Booking>(`/api/bookings/${id}/cancel`, {
      method: 'POST',
    });
  }

  public async resetData(): Promise<{ message: string }> {
    return this.request<{ message: string }>('/api/reset-data', {
      method: 'POST',
    });
  }

  public async simulateRaceCondition(): Promise<any> {
    return this.request<any>('/api/simulate-race-condition', {
      method: 'POST',
    });
  }
}

export const api = new ApiService();
