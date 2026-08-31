import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  Loader2,
  RefreshCw,
  Trash2,
  Video,
  X,
  Zap,
} from 'lucide-react';
import React, { useState } from 'react';
import { api } from '../services/api.js';
import { Booking } from '../types.js';
import {
  downloadIcsFile,
  formatCentsToCurrency,
  formatRelativeStartsIn,
  formatSlotDate,
  formatSlotTime,
  getMinutesUntil,
} from '../utils/formatters.js';

interface AppointmentsHistoryProps {
  bookings: Booking[];
  loading: boolean;
  userTimezone: string;
  onRefresh: () => void;
  onBrowseExperts: () => void;
  onBookingUpdated: () => void;
}

export const AppointmentsHistory: React.FC<AppointmentsHistoryProps> = ({
  bookings,
  loading,
  userTimezone,
  onRefresh,
  onBrowseExperts,
  onBookingUpdated,
}) => {
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'cancelled'>('all');
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [confirmCancelModal, setConfirmCancelModal] = useState<Booking | null>(null);

  const filteredBookings = bookings.filter((b) => {
    if (filter === 'upcoming') return b.status === 'confirmed';
    if (filter === 'cancelled') return b.status === 'cancelled';
    return true;
  });

  const handleCancelBooking = async (booking: Booking) => {
    setCancellingId(booking.id);
    try {
      await api.cancelBooking(booking.id);
      setConfirmCancelModal(null);
      onBookingUpdated();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel appointment');
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Row with Bento Style */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-5">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Booking History
          </h2>
          <p className="text-xs text-slate-400 font-medium uppercase tracking-widest mt-1">
            Your Active & Completed Consultation Activity
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Refresh button */}
          <button
            onClick={onRefresh}
            className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-sm"
            title="Refresh appointments"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-indigo-600' : 'text-slate-400'}`} />
            <span>Refresh</span>
          </button>

          {/* Tab Filter Pills */}
          <div className="flex rounded-2xl bg-white border border-slate-200 p-1 text-xs font-bold shadow-sm">
            <button
              onClick={() => setFilter('all')}
              className={`rounded-xl px-4 py-1.5 transition ${
                filter === 'all'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({bookings.length})
            </button>
            <button
              onClick={() => setFilter('upcoming')}
              className={`rounded-xl px-4 py-1.5 transition ${
                filter === 'upcoming'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Upcoming ({bookings.filter((b) => b.status === 'confirmed').length})
            </button>
            <button
              onClick={() => setFilter('cancelled')}
              className={`rounded-xl px-4 py-1.5 transition ${
                filter === 'cancelled'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cancelled ({bookings.filter((b) => b.status === 'cancelled').length})
            </button>
          </div>
        </div>
      </div>

      {/* Appointments List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="mt-3 text-xs font-semibold">Loading your appointments...</p>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="rounded-[2.5rem] border border-dashed border-slate-200 bg-white p-14 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 shadow-sm">
            <Calendar className="h-7 w-7" />
          </div>
          <h3 className="mt-4 text-base font-bold text-slate-900">
            No {filter !== 'all' ? filter : ''} appointments found
          </h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            You don't have any consultation sessions matching this filter. Browse our verified roster of industry experts to book one.
          </p>
          <button
            onClick={onBrowseExperts}
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-slate-200 hover:bg-slate-800 transition"
          >
            <span>Browse Available Experts</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {filteredBookings.map((booking) => {
            const isConfirmed = booking.status === 'confirmed';
            const isCancelled = booking.status === 'cancelled';
            const minsUntil = getMinutesUntil(booking.slot.startTime);
            const isLive = isConfirmed && minsUntil <= 5 && minsUntil >= -30;

            return (
              <div
                key={booking.id}
                className={`relative flex flex-col justify-between rounded-3xl border bg-white p-6 shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md ${
                  isCancelled
                    ? 'border-slate-200 opacity-70 bg-slate-50/50'
                    : isLive
                    ? 'border-emerald-300 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:border-indigo-300'
                }`}
              >
                {/* Left Bento Accent Bar */}
                <div
                  className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                    isCancelled
                      ? 'bg-slate-300'
                      : isLive
                      ? 'bg-emerald-500'
                      : 'bg-indigo-600'
                  }`}
                />

                <div>
                  {/* Status Pill & Code */}
                  <div className="flex items-center justify-between gap-2 pl-2">
                    <div className="flex items-center gap-2">
                      {isLive ? (
                        <span className="flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider rounded-md shadow-xs animate-pulse">
                          <span className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75"></span>
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-white"></span>
                          </span>
                          LIVE NOW
                        </span>
                      ) : isConfirmed ? (
                        <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase rounded-md tracking-wider">
                          Upcoming
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 bg-rose-50 text-rose-700 text-[10px] font-bold uppercase rounded-md tracking-wider">
                          Cancelled
                        </span>
                      )}

                      <span className="font-mono text-xs font-bold text-slate-400">
                        {booking.confirmationCode}
                      </span>
                    </div>

                    <span className="text-sm font-black text-slate-900">
                      {formatCentsToCurrency(booking.totalAmountCents, booking.currency)}
                    </span>
                  </div>

                  {/* Expert Details */}
                  <div className="mt-4 flex items-start gap-3.5 pl-2">
                    <img
                      src={booking.expert.avatarUrl}
                      alt={booking.expert.name}
                      referrerPolicy="no-referrer"
                      className="h-12 w-12 rounded-2xl bg-indigo-50 border-2 border-white shadow-sm object-cover ring-1 ring-slate-100 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-slate-900 truncate">
                        {booking.expert.name}
                      </h4>
                      <p className="text-xs text-slate-400 font-medium truncate">{booking.expert.title}</p>
                      <span className="inline-block mt-1 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600">
                        {booking.expert.category}
                      </span>
                    </div>
                  </div>

                  {/* Date & Time Row */}
                  <div className="mt-4 rounded-2xl bg-slate-50 p-3.5 text-xs space-y-2 border border-slate-100 ml-2">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 font-bold text-slate-800">
                        <Calendar className="h-3.5 w-3.5 text-indigo-600" />
                        <span>{formatSlotDate(booking.slot.startTime, userTimezone)}</span>
                      </span>
                      <span className="font-bold text-indigo-600">
                        {formatSlotTime(booking.slot.startTime, userTimezone)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-200/60 pt-2">
                      <span className="font-medium">Timeline:</span>
                      <span className="font-bold text-slate-700">
                        {formatRelativeStartsIn(booking.slot.startTime)}
                      </span>
                    </div>
                  </div>

                  {/* User Notes */}
                  {booking.user.notes && (
                    <div className="mt-3 text-xs text-slate-600 bg-indigo-50/40 rounded-xl p-3 border border-indigo-100/60 ml-2">
                      <span className="font-bold text-indigo-950 block text-[11px]">
                        Session Objective:
                      </span>
                      <p className="line-clamp-2 mt-0.5 text-slate-700 leading-relaxed">{booking.user.notes}</p>
                    </div>
                  )}
                </div>

                {/* Actions Row */}
                <div className="mt-5 border-t border-slate-100 pt-4 flex flex-wrap items-center justify-between gap-2 pl-2">
                  <div className="flex items-center gap-2">
                    {/* Download ICS */}
                    {isConfirmed && (
                      <button
                        onClick={() => downloadIcsFile(booking)}
                        className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                        title="Add to Google Calendar / Apple Calendar"
                      >
                        <Download className="h-3.5 w-3.5 text-indigo-600" />
                        <span className="hidden sm:inline">.ICS Invite</span>
                      </button>
                    )}

                    {/* Cancel Action */}
                    {isConfirmed && (
                      <button
                        onClick={() => setConfirmCancelModal(booking)}
                        className="flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 transition"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Cancel</span>
                      </button>
                    )}
                  </div>

                  {/* Join Meeting Action */}
                  {isConfirmed && (
                    <a
                      href={booking.meetingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className={`flex items-center gap-2 rounded-2xl px-5 py-2 text-xs font-bold text-white transition shadow-md ${
                        isLive
                          ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20 animate-pulse'
                          : 'bg-slate-900 hover:bg-slate-800 shadow-slate-200'
                      }`}
                    >
                      <Video className="h-3.5 w-3.5" />
                      <span>Join Room</span>
                      <ExternalLink className="h-3 w-3 opacity-70" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cancel Confirmation Modal with Bento styling */}
      {confirmCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 mx-auto">
              <AlertTriangle className="h-6 w-6" />
            </div>

            <div className="mt-4 text-center">
              <h3 className="text-base font-bold text-slate-900">
                Cancel Consultation Session?
              </h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Are you sure you want to cancel your session with{' '}
                <strong>{confirmCancelModal.expert.name}</strong> on{' '}
                {formatSlotDate(confirmCancelModal.slot.startTime, userTimezone)}? This slot
                will be immediately released back into the expert's available inventory.
              </p>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmCancelModal(null)}
                className="rounded-2xl border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Keep Session
              </button>

              <button
                type="button"
                disabled={cancellingId === confirmCancelModal.id}
                onClick={() => handleCancelBooking(confirmCancelModal)}
                className="flex items-center gap-2 rounded-2xl bg-rose-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-rose-500/20 hover:bg-rose-700 transition"
              >
                {cancellingId === confirmCancelModal.id ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Cancelling...</span>
                  </>
                ) : (
                  <span>Yes, Cancel & Release</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

