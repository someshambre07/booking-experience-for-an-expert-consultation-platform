import {
  AlertCircle,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  Globe2,
  Info,
  Loader2,
  Lock,
  Sparkles,
  User,
  Video,
  X,
  Zap,
} from 'lucide-react';
import React, { useEffect, useId, useState } from 'react';
import { api } from '../services/api.js';
import { Booking, BookingUser, Expert, TimeSlot } from '../types.js';
import {
  downloadIcsFile,
  formatCentsToCurrency,
  formatRelativeStartsIn,
  formatSlotDate,
  formatSlotTime,
} from '../utils/formatters.js';

interface BookingModalProps {
  expert: Expert;
  userTimezone: string;
  onClose: () => void;
  onBookingSuccess: (booking: Booking) => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  expert,
  userTimezone,
  onClose,
  onBookingSuccess,
}) => {
  const [step, setStep] = useState<'slot' | 'details' | 'confirmed'>('slot');
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(true);

  // Form State
  const [form, setForm] = useState<BookingUser>({
    name: '',
    email: '',
    timezone: userTimezone,
    notes: '',
  });

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState<string>('');

  // Generate unique idempotency key per checkout initiation
  useEffect(() => {
    setIdempotencyKey(`idemp_${expert.id}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);
  }, [expert.id]);

  // Fetch live slots for this expert
  useEffect(() => {
    let isMounted = true;
    setLoadingSlots(true);
    api
      .getSlots(expert.id)
      .then((data) => {
        if (!isMounted) return;
        setSlots(data);
        // Auto-select first available future slot or live slot
        const now = Date.now();
        const available = data.filter(
          (s) => s.status === 'available' && new Date(s.startTime).getTime() > now
        );
        if (available.length > 0) {
          setSelectedSlot(available[0]);
        }
      })
      .catch((err) => {
        console.error('Failed to load slots:', err);
      })
      .finally(() => {
        if (isMounted) setLoadingSlots(false);
      });

    return () => {
      isMounted = false;
    };
  }, [expert.id]);

  // Group slots by date
  const groupedSlots = React.useMemo(() => {
    const map = new Map<string, TimeSlot[]>();
    const now = Date.now();

    slots.forEach((s) => {
      // Exclude past slots from standard user selection unless specifically inspecting
      const isPast = new Date(s.startTime).getTime() <= now;
      const dateLabel = formatSlotDate(s.startTime, userTimezone);

      if (!map.has(dateLabel)) {
        map.set(dateLabel, []);
      }
      map.get(dateLabel)!.push(s);
    });

    return Array.from(map.entries());
  }, [slots, userTimezone]);

  const handleProceedToDetails = () => {
    if (!selectedSlot) return;
    setErrorMessage(null);
    setStep('details');
  };

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) return;

    // Validation
    if (!form.name.trim()) {
      setErrorMessage('Please enter your full name');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.email.trim() || !emailRegex.test(form.email.trim())) {
      setErrorMessage('Please enter a valid work or personal email address');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    setErrorCode(null);

    try {
      const booking = await api.createBooking({
        expertId: expert.id,
        slotId: selectedSlot.id,
        user: {
          ...form,
          timezone: userTimezone,
        },
        idempotencyKey,
      });

      setConfirmedBooking(booking);
      setStep('confirmed');
      onBookingSuccess(booking);
    } catch (err: any) {
      console.error('Booking failed:', err);
      setErrorCode(err.code || 'BOOKING_ERROR');
      if (err.code === 'SLOT_ALREADY_BOOKED' || err.statusCode === 409) {
        setErrorMessage(
          'Slot Conflict: Another client just booked this exact slot seconds ago. Please select another slot.'
        );
        // Refresh slots list to reflect booked status
        api.getSlots(expert.id).then(setSlots);
      } else if (err.code === 'SLOT_IN_PAST' || err.statusCode === 422) {
        setErrorMessage('This slot time has already passed. Please select an upcoming slot.');
      } else {
        setErrorMessage(err.message || 'Failed to complete booking. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200/80 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-6 py-4">
          <div className="flex items-center gap-3">
            <img
              src={expert.avatarUrl}
              alt={expert.name}
              referrerPolicy="no-referrer"
              className="h-11 w-11 rounded-xl object-cover ring-2 ring-white shadow-xs"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">{expert.name}</h2>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                  {expert.category}
                </span>
              </div>
              <p className="text-xs text-slate-500">{expert.title}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {/* STEP 1: SLOT SELECTION */}
          {step === 'slot' && (
            <div className="space-y-5">
              {/* Dual Timezone Context Box */}
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3.5 text-xs text-indigo-900">
                <div className="flex items-center gap-2 font-semibold text-indigo-950">
                  <Globe2 className="h-4 w-4 text-indigo-600" />
                  <span>Timezone Coordination</span>
                </div>
                <div className="mt-1.5 grid grid-cols-1 gap-1 sm:grid-cols-2 text-slate-600">
                  <div>
                    <span className="font-medium text-slate-900">Your Local Time:</span>{' '}
                    <span>{userTimezone}</span>
                  </div>
                  <div>
                    <span className="font-medium text-slate-900">Expert Time:</span>{' '}
                    <span>{expert.timezone}</span>
                  </div>
                </div>
              </div>

              {/* Slot Picker */}
              <div>
                <div className="mb-2.5 flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Select 30-Minute Consultation Slot
                  </label>
                  <span className="text-xs font-medium text-slate-500">
                    Duration: <strong className="text-slate-800">30 mins</strong>
                  </span>
                </div>

                {loadingSlots ? (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                    <p className="mt-2 text-xs font-medium">Checking live expert calendar...</p>
                  </div>
                ) : slots.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-slate-500 text-xs">
                    No open slots currently available for this expert.
                  </div>
                ) : (
                  <div className="max-h-[300px] space-y-4 overflow-y-auto pr-1">
                    {groupedSlots.map(([dateLabel, dateSlots]) => (
                      <div key={dateLabel}>
                        <div className="mb-2 flex items-center gap-2 text-xs font-bold text-slate-800">
                          <Calendar className="h-3.5 w-3.5 text-indigo-600" />
                          <span>{dateLabel}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                          {dateSlots.map((s) => {
                            const isSelected = selectedSlot?.id === s.id;
                            const isBooked = s.status === 'booked';
                            const isPast = new Date(s.startTime).getTime() <= Date.now();
                            const isRightNow =
                              !isPast &&
                              new Date(s.startTime).getTime() - Date.now() <= 30 * 60 * 1000;

                            const isDisabled = isBooked || isPast;

                            return (
                              <button
                                key={s.id}
                                disabled={isDisabled}
                                onClick={() => {
                                  setSelectedSlot(s);
                                  setErrorMessage(null);
                                }}
                                className={`group relative flex flex-col items-center justify-center rounded-xl border p-2.5 text-xs font-semibold transition ${
                                  isDisabled
                                    ? 'border-slate-100 bg-slate-50/70 text-slate-300 cursor-not-allowed line-through'
                                    : isSelected
                                    ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm'
                                    : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/30'
                                }`}
                              >
                                <span>{formatSlotTime(s.startTime, userTimezone)}</span>

                                {isRightNow && !isSelected && (
                                  <span className="mt-1 flex items-center gap-1 rounded-full bg-emerald-100 px-1.5 py-0.2 text-[9px] font-bold text-emerald-800">
                                    <Zap className="h-2.5 w-2.5 fill-current" /> Live Now
                                  </span>
                                )}

                                {isBooked && (
                                  <span className="mt-1 text-[9px] font-medium text-slate-400">
                                    Booked
                                  </span>
                                )}

                                {isPast && !isBooked && (
                                  <span className="mt-1 text-[9px] font-medium text-slate-400">
                                    Past
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Price & Summary */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                <div>
                  <span className="text-xs text-slate-500">Session Total:</span>
                  <div className="text-lg font-extrabold text-slate-900">
                    {formatCentsToCurrency(expert.ratePerSessionCents, expert.currency)}
                  </div>
                </div>

                <button
                  disabled={!selectedSlot}
                  onClick={handleProceedToDetails}
                  className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-500/20 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <span>Next: Client Details</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: USER DETAILS & CONFIRMATION */}
          {step === 'details' && (
            <form onSubmit={handleSubmitBooking} className="space-y-4">
              {/* Selected Slot Summary Header */}
              {selectedSlot && (
                <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3.5 border border-slate-200/80">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
                      <Clock className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        {formatSlotDate(selectedSlot.startTime, userTimezone)} at{' '}
                        {formatSlotTime(selectedSlot.startTime, userTimezone)}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        30-minute consultation with {expert.name}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setStep('slot')}
                    className="text-xs font-semibold text-indigo-600 hover:underline"
                  >
                    Change Slot
                  </button>
                </div>
              )}

              {/* Error Box */}
              {errorMessage && (
                <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                  <div className="flex-1">
                    <strong className="block font-semibold">Booking Error:</strong>
                    <span>{errorMessage}</span>
                    {errorCode === 'SLOT_ALREADY_BOOKED' && (
                      <button
                        type="button"
                        onClick={() => setStep('slot')}
                        className="mt-1.5 block font-bold text-rose-900 underline"
                      >
                        ← Choose a different time slot
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Client Form Fields */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Sarah Connor"
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="sarah@company.com"
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Session Topic / Key Questions for the Advisor
                </label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="e.g. We are hitting token latency issues with our multi-agent pipeline and need architectural guidance on streaming vs batching."
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Guaranteed Security Badge */}
              <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-2.5 text-[11px] text-slate-500">
                <Lock className="h-3.5 w-3.5 text-emerald-600" />
                <span>
                  Instant atomic slot reservation with idempotent double-tap protection.
                </span>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setStep('slot')}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  ← Back to Slots
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-700 disabled:opacity-50 transition"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Confirming Session...</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      <span>
                        Confirm & Reserve (
                        {formatCentsToCurrency(expert.ratePerSessionCents, expert.currency)})
                      </span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: BOOKING CONFIRMED RECEIPT */}
          {step === 'confirmed' && confirmedBooking && (
            <div className="text-center py-2 space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 shadow-md shadow-emerald-500/10">
                <CheckCircle2 className="h-8 w-8" />
              </div>

              <div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  Consultation Confirmed!
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Confirmation code:{' '}
                  <strong className="text-indigo-600 font-mono font-bold tracking-wider">
                    {confirmedBooking.confirmationCode}
                  </strong>
                </p>
              </div>

              {/* Receipt Summary Card */}
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 text-left text-xs space-y-2.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Expert:</span>
                  <span className="font-semibold text-slate-900">
                    {confirmedBooking.expert.name} ({confirmedBooking.expert.title})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Date & Time:</span>
                  <span className="font-semibold text-slate-900">
                    {formatSlotDate(confirmedBooking.slot.startTime, userTimezone)} at{' '}
                    {formatSlotTime(confirmedBooking.slot.startTime, userTimezone)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Duration:</span>
                  <span className="font-semibold text-slate-900">30 Minutes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Charged:</span>
                  <span className="font-bold text-slate-900">
                    {formatCentsToCurrency(
                      confirmedBooking.totalAmountCents,
                      confirmedBooking.currency
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center border-t border-slate-200/60 pt-2">
                  <span className="text-slate-500">Meeting Room:</span>
                  <a
                    href={confirmedBooking.meetingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 font-mono text-[11px] font-bold text-indigo-600 hover:underline"
                  >
                    <span>{confirmedBooking.meetingUrl}</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>

              {/* Quick Post-Booking Actions */}
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 pt-2">
                <button
                  onClick={() => downloadIcsFile(confirmedBooking)}
                  className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs"
                >
                  <Download className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Download .ICS Calendar</span>
                </button>

                <button
                  onClick={onClose}
                  className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition shadow-xs"
                >
                  <span>Done & View in History</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
