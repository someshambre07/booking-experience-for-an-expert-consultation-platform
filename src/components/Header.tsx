import {
  BookOpen,
  Calendar,
  Clock,
  Download,
  Globe,
  Sparkles,
  Users,
} from 'lucide-react';
import React from 'react';
import { COMMON_TIMEZONES } from '../utils/formatters.js';

interface HeaderProps {
  currentTab: 'browse' | 'history' | 'architecture';
  onTabChange: (tab: 'browse' | 'history' | 'architecture') => void;
  bookingCount: number;
  availableNowCount: number;
  userTimezone: string;
  onTimezoneChange: (tz: string) => void;
  onDownloadZip: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  bookingCount,
  availableNowCount,
  userTimezone,
  onTimezoneChange,
  onDownloadZip,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-[#F3F4F6]/90 backdrop-blur-md transition-all py-3">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between gap-4">
          {/* Brand Logo with Bento styling */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onTabChange('browse')}
              className="group flex items-center gap-3 text-left focus:outline-none"
            >
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 text-white transition group-hover:scale-105">
                <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    ExpertConnect
                  </span>
                  <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase rounded-md">
                    PRO
                  </span>
                </div>
              </div>
            </button>
          </div>

          {/* Center: Bento Navigation Pills */}
          <nav className="hidden md:flex items-center gap-1.5 bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
            <button
              onClick={() => onTabChange('browse')}
              className={`flex items-center gap-2 rounded-xl px-4 py-1.5 text-xs font-bold transition ${
                currentTab === 'browse'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Users className="h-4 w-4" />
              <span>Available Experts</span>
              {availableNowCount > 0 && (
                <span className={`flex h-2 w-2 rounded-full ${currentTab === 'browse' ? 'bg-emerald-300' : 'bg-emerald-500'}`} />
              )}
            </button>

            <button
              onClick={() => onTabChange('history')}
              className={`flex items-center gap-2 rounded-xl px-4 py-1.5 text-xs font-bold transition ${
                currentTab === 'history'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Calendar className="h-4 w-4" />
              <span>Booking History</span>
              {bookingCount > 0 && (
                <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${currentTab === 'history' ? 'bg-white text-indigo-700' : 'bg-indigo-600 text-white'}`}>
                  {bookingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onTabChange('architecture')}
              className={`flex items-center gap-2 rounded-xl px-4 py-1.5 text-xs font-bold transition ${
                currentTab === 'architecture'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <BookOpen className="h-4 w-4" />
              <span>Architecture & Tests</span>
            </button>
          </nav>

          {/* Right: Timezone & Balance/User Bento Widget */}
          <div className="flex items-center gap-3">
            {/* Timezone picker */}
            <div className="relative hidden lg:flex items-center bg-white px-3 py-1.5 rounded-2xl border border-slate-200 shadow-sm">
              <Globe className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-slate-400" />
              <select
                value={userTimezone}
                onChange={(e) => onTimezoneChange(e.target.value)}
                className="cursor-pointer appearance-none bg-transparent py-0.5 pl-6 pr-6 text-xs font-semibold text-slate-700 hover:text-slate-900 focus:outline-none"
                title="Your detected local timezone"
              >
                {COMMON_TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
              <Clock className="pointer-events-none absolute right-3 h-3 w-3 text-slate-400" />
            </div>

            {/* User Account / Balance Widget from Bento Design */}
            <div className="hidden sm:flex items-center gap-3 bg-white px-3.5 py-1.5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Account</span>
                <span className="text-xs font-bold text-slate-900">Client Ready</span>
              </div>
              <div className="w-px h-6 bg-slate-200" />
              <img
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
                className="w-7 h-7 rounded-full bg-slate-100 ring-1 ring-slate-200"
                alt="User"
              />
            </div>

            {/* Instant Download ZIP Button */}
            <button
              onClick={onDownloadZip}
              className="flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-slate-200 transition hover:bg-slate-800 active:scale-95 shrink-0"
              title="Download Complete Project ZIP"
            >
              <Download className="h-3.5 w-3.5 text-indigo-300" />
              <span className="hidden sm:inline">Export ZIP</span>
              <span className="sm:hidden">ZIP</span>
            </button>
          </div>
        </div>

        {/* Mobile Tab Bar */}
        <div className="flex pt-3 md:hidden">
          <div className="grid w-full grid-cols-3 gap-1 bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
            <button
              onClick={() => onTabChange('browse')}
              className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold ${
                currentTab === 'browse'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600'
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>Experts</span>
            </button>

            <button
              onClick={() => onTabChange('history')}
              className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold ${
                currentTab === 'history'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600'
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>Bookings</span>
              {bookingCount > 0 && (
                <span className="rounded-full bg-white text-indigo-700 font-bold px-1.5 text-[10px]">
                  {bookingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onTabChange('architecture')}
              className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold ${
                currentTab === 'architecture'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600'
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>Specs</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

