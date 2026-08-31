import { generateSeedData } from './seed.js';
import { Booking, CreateBookingPayload, Expert, TimeSlot } from './types.js';

export class Store {
  private experts: Map<string, Expert> = new Map();
  private slots: Map<string, TimeSlot> = new Map();
  private bookings: Map<string, Booking> = new Map();
  private idempotencyKeys: Map<string, string> = new Map(); // key -> bookingId

  constructor() {
    this.reset();
  }

  public reset(): void {
    this.experts.clear();
    this.slots.clear();
    this.bookings.clear();
    this.idempotencyKeys.clear();

    const { experts, slots } = generateSeedData();
    experts.forEach((exp) => this.experts.set(exp.id, exp));
    slots.forEach((s) => this.slots.set(s.id, s));

    // Seed 1-2 initial confirmed sample bookings so the user immediately sees a populated, realistic history!
    const sampleExpert = experts[0];
    const sampleSlot = slots.find((s) => s.expertId === sampleExpert.id && s.id.includes('slot-exp-1-2'));
    if (sampleSlot) {
      sampleSlot.status = 'booked';
      const sampleBooking: Booking = {
        id: 'book-sample-101',
        confirmationCode: 'CNS-7294',
        expertId: sampleExpert.id,
        expert: {
          id: sampleExpert.id,
          name: sampleExpert.name,
          title: sampleExpert.title,
          avatarUrl: sampleExpert.avatarUrl,
          category: sampleExpert.category,
          timezone: sampleExpert.timezone
        },
        slotId: sampleSlot.id,
        slot: {
          id: sampleSlot.id,
          startTime: sampleSlot.startTime,
          endTime: sampleSlot.endTime,
          durationMinutes: sampleSlot.durationMinutes
        },
        user: {
          name: 'Alex Rivera',
          email: 'alex.rivera@techcorp.io',
          timezone: 'America/New_York',
          notes: 'Evaluating multi-agent pipeline architecture and GPU memory bottlenecks before Q4 launch.'
        },
        totalAmountCents: sampleExpert.ratePerSessionCents,
        currency: sampleExpert.currency,
        status: 'confirmed',
        createdAt: new Date(Date.now() - 3600 * 1000 * 3).toISOString(),
        meetingUrl: 'https://meet.consult.app/room/CNS-7294'
      };
      this.bookings.set(sampleBooking.id, sampleBooking);
    }
  }

  public getExperts(query: {
    category?: string;
    search?: string;
    availableNow?: boolean;
    sortBy?: string;
  }): Array<Expert & { slotsCount: number; isAvailableRightNow: boolean; nextAvailableSlot: TimeSlot | null }> {
    const now = Date.now();
    const thirtyMins = 30 * 60 * 1000;

    let list = Array.from(this.experts.values()).map((exp) => {
      const expertSlots = Array.from(this.slots.values()).filter(
        (s) => s.expertId === exp.id && s.status === 'available'
      );

      // Future available slots
      const futureSlots = expertSlots
        .filter((s) => new Date(s.startTime).getTime() > now)
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

      // Check if any slot starts within next 30 minutes
      const hasSlotRightNow = futureSlots.some((s) => {
        const diff = new Date(s.startTime).getTime() - now;
        return diff > 0 && diff <= thirtyMins;
      });

      return {
        ...exp,
        slotsCount: futureSlots.length,
        isAvailableRightNow: hasSlotRightNow,
        nextAvailableSlot: futureSlots[0] || null
      };
    });

    // Category filter
    if (query.category && query.category !== 'All') {
      list = list.filter((exp) => exp.category.toLowerCase() === query.category?.toLowerCase());
    }

    // Search query filter (name, title, bio, topics)
    if (query.search && query.search.trim()) {
      const q = query.search.toLowerCase().trim();
      list = list.filter(
        (exp) =>
          exp.name.toLowerCase().includes(q) ||
          exp.title.toLowerCase().includes(q) ||
          exp.company.toLowerCase().includes(q) ||
          exp.bio.toLowerCase().includes(q) ||
          exp.topics.some((t) => t.toLowerCase().includes(q))
      );
    }

    // Available right now filter
    if (query.availableNow) {
      list = list.filter((exp) => exp.isAvailableRightNow);
    }

    // Sorting
    if (query.sortBy === 'price_asc') {
      list.sort((a, b) => a.ratePerSessionCents - b.ratePerSessionCents);
    } else if (query.sortBy === 'price_desc') {
      list.sort((a, b) => b.ratePerSessionCents - a.ratePerSessionCents);
    } else if (query.sortBy === 'rating') {
      list.sort((a, b) => b.rating - a.rating);
    } else if (query.sortBy === 'experience') {
      list.sort((a, b) => b.yearsExperience - a.yearsExperience);
    } else {
      // Default: available right now first, then rating
      list.sort((a, b) => {
        if (a.isAvailableRightNow && !b.isAvailableRightNow) return -1;
        if (!a.isAvailableRightNow && b.isAvailableRightNow) return 1;
        return b.rating - a.rating;
      });
    }

    return list;
  }

  public getExpertById(id: string): (Expert & { slots: TimeSlot[]; isAvailableRightNow: boolean }) | null {
    const expert = this.experts.get(id);
    if (!expert) return null;

    const now = Date.now();
    const thirtyMins = 30 * 60 * 1000;
    const slots = Array.from(this.slots.values())
      .filter((s) => s.expertId === id)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    const isAvailableRightNow = slots.some((s) => {
      if (s.status !== 'available') return false;
      const diff = new Date(s.startTime).getTime() - now;
      return diff > 0 && diff <= thirtyMins;
    });

    return {
      ...expert,
      slots,
      isAvailableRightNow
    };
  }

  public getSlotsByExpertId(expertId: string): TimeSlot[] {
    return Array.from(this.slots.values())
      .filter((s) => s.expertId === expertId)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }

  public getSlotById(slotId: string): TimeSlot | null {
    return this.slots.get(slotId) || null;
  }

  /**
   * Atomic Check-and-Set Booking Operation
   * Enforces all edge cases:
   * 1. Idempotency Key deduplication
   * 2. Slot existence & expert mismatch verification
   * 3. Past-slot rejection (422)
   * 4. Atomic conflict resolution / double booking rejection (409)
   */
  public createBooking(payload: CreateBookingPayload): {
    booking: Booking;
    isReplay: boolean;
  } {
    const { expertId, slotId, user, idempotencyKey } = payload;

    // 1. Check Idempotency Key (Network retry / double tap protection)
    if (idempotencyKey && this.idempotencyKeys.has(idempotencyKey)) {
      const existingBookingId = this.idempotencyKeys.get(idempotencyKey)!;
      const existing = this.bookings.get(existingBookingId);
      if (existing) {
        return { booking: existing, isReplay: true };
      }
    }

    // 2. Validate Expert & Slot
    const expert = this.experts.get(expertId);
    if (!expert) {
      const err: any = new Error(`Expert not found with ID: ${expertId}`);
      err.statusCode = 404;
      err.code = 'EXPERT_NOT_FOUND';
      throw err;
    }

    const slot = this.slots.get(slotId);
    if (!slot) {
      const err: any = new Error(`Time slot not found with ID: ${slotId}`);
      err.statusCode = 404;
      err.code = 'SLOT_NOT_FOUND';
      throw err;
    }

    if (slot.expertId !== expertId) {
      const err: any = new Error(`Time slot ${slotId} does not belong to expert ${expertId}`);
      err.statusCode = 400;
      err.code = 'SLOT_EXPERT_MISMATCH';
      throw err;
    }

    // 3. Past Slot Edge Case Check (422 Unprocessable Entity)
    const slotTimeMs = new Date(slot.startTime).getTime();
    const nowMs = Date.now();
    if (slotTimeMs <= nowMs) {
      const err: any = new Error(
        `Cannot book a consultation slot in the past. Slot start was: ${slot.startTime}`
      );
      err.statusCode = 422;
      err.code = 'SLOT_IN_PAST';
      throw err;
    }

    // 4. Atomic Race Condition Check-and-Set (409 Conflict)
    // Synchronous execution in Node event loop guarantees no interleaving
    if (slot.status !== 'available') {
      const err: any = new Error(
        `This consultation slot has already been booked by another client. Please select another slot.`
      );
      err.statusCode = 409;
      err.code = 'SLOT_ALREADY_BOOKED';
      throw err;
    }

    // Mark slot as booked synchronously
    slot.status = 'booked';

    // 5. Create Booking Entity
    const confirmationCode = `CNS-${Math.floor(1000 + Math.random() * 9000)}`;
    const bookingId = `book-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const newBooking: Booking = {
      id: bookingId,
      confirmationCode,
      expertId: expert.id,
      expert: {
        id: expert.id,
        name: expert.name,
        title: expert.title,
        avatarUrl: expert.avatarUrl,
        category: expert.category,
        timezone: expert.timezone
      },
      slotId: slot.id,
      slot: {
        id: slot.id,
        startTime: slot.startTime,
        endTime: slot.endTime,
        durationMinutes: slot.durationMinutes
      },
      user: {
        name: user.name.trim(),
        email: user.email.toLowerCase().trim(),
        timezone: user.timezone || 'UTC',
        notes: user.notes?.trim() || '',
        phone: user.phone?.trim()
      },
      totalAmountCents: expert.ratePerSessionCents,
      currency: expert.currency,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
      meetingUrl: `https://meet.consult.app/room/${confirmationCode}`,
      idempotencyKey
    };

    this.bookings.set(bookingId, newBooking);

    if (idempotencyKey) {
      this.idempotencyKeys.set(idempotencyKey, bookingId);
    }

    return { booking: newBooking, isReplay: false };
  }

  public getAllBookings(filterEmail?: string): Booking[] {
    let list = Array.from(this.bookings.values());
    if (filterEmail) {
      list = list.filter((b) => b.user.email.toLowerCase() === filterEmail.toLowerCase().trim());
    }
    // Sort descending by creation date
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getBookingById(id: string): Booking | null {
    return this.bookings.get(id) || null;
  }

  public cancelBooking(id: string): Booking {
    const booking = this.bookings.get(id);
    if (!booking) {
      const err: any = new Error(`Booking not found with ID: ${id}`);
      err.statusCode = 404;
      err.code = 'BOOKING_NOT_FOUND';
      throw err;
    }

    if (booking.status === 'cancelled') {
      return booking;
    }

    booking.status = 'cancelled';

    // Free the slot back to available if start time is in the future
    const slot = this.slots.get(booking.slotId);
    if (slot && new Date(slot.startTime).getTime() > Date.now()) {
      slot.status = 'available';
    }

    return booking;
  }
}

export const store = new Store();
