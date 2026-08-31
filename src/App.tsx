/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AnimatePresence, motion } from 'motion/react';
import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Loader2,
  RefreshCw,
  Search,
  Sparkles,
  Users,
  WifiOff,
  Zap,
} from 'lucide-react';
import { AppointmentsHistory } from './components/AppointmentsHistory.js';
import { ArchitectureDocs } from './components/ArchitectureDocs.js';
import { BookingModal } from './components/BookingModal.js';
import { ExpertCard } from './components/ExpertCard.js';
import { ExpertFilterBar } from './components/ExpertFilterBar.js';
import { Header } from './components/Header.js';
import { ZipDownloadModal } from './components/ZipDownloadModal.js';
import { api } from './services/api.js';
import { Booking, Expert, ExpertCategory, FilterState } from './types.js';

export default function App() {
  // Navigation & View
  const [currentTab, setCurrentTab] = useState<'browse' | 'history' | 'architecture'>('browse');

  // Timezone (auto-detect user's device timezone default)
  const [userTimezone, setUserTimezone] = useState<string>(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York';
    } catch {
      return 'America/New_York';
    }
  });

  // Filter & Search State
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    category: 'All',
    availableNowOnly: false,
    sortBy: 'recommended',
    userTimezone,
  });

  // Data States
  const [experts, setExperts] = useState<Expert[]>([]);
  const [categories, setCategories] = useState<Array<{ name: string; count: number }>>([]);
  const [availableNowCount, setAvailableNowCount] = useState<number>(0);
  const [bookings, setBookings] = useState<Booking[]>([]);

  // Loading & Error States
  const [loadingExperts, setLoadingExperts] = useState<boolean>(true);
  const [loadingBookings, setLoadingBookings] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState<boolean>(!window.navigator.onLine);

  // Active Modals
  const [selectedExpertForBooking, setSelectedExpertForBooking] = useState<Expert | null>(null);
  const [showZipModal, setShowZipModal] = useState<boolean>(false);
  const [recentBookingToast, setRecentBookingToast] = useState<Booking | null>(null);

  // Monitor network offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch Categories
  const fetchCategories = async () => {
    try {
      const data = await api.getCategories();
      setCategories(data.categories);
      setAvailableNowCount(data.availableNowCount);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  // Fetch Experts
  const fetchExperts = async () => {
    setLoadingExperts(true);
    setError(null);
    try {
      const data = await api.getExperts({
        category: filters.category,
        search: filters.search,
        availableNow: filters.availableNowOnly,
        sortBy: filters.sortBy,
      });
      setExperts(data);
    } catch (err: any) {
      console.error('Failed to load experts:', err);
      setError(err.message || 'Unable to connect to advisory API server');
    } finally {
      setLoadingExperts(false);
    }
  };

  // Fetch Bookings
  const fetchBookings = async () => {
    setLoadingBookings(true);
    try {
      const data = await api.getBookings();
      setBookings(data);
    } catch (err) {
      console.error('Failed to load bookings:', err);
    } finally {
      setLoadingBookings(false);
    }
  };

  // Initial Load
  useEffect(() => {
    fetchCategories();
    fetchBookings();
  }, []);

  // Refetch experts when filter states change
  useEffect(() => {
    fetchExperts();
  }, [filters.category, filters.search, filters.availableNowOnly, filters.sortBy]);

  // Handle successful booking
  const handleBookingSuccess = (newBooking: Booking) => {
    // Add to bookings list
    setBookings((prev) => [newBooking, ...prev]);
    // Refresh experts to update slot counts
    fetchExperts();
    fetchCategories();
    // Show quick toast notification
    setRecentBookingToast(newBooking);
    setTimeout(() => {
      setRecentBookingToast(null);
    }, 6000);
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      category: 'All',
      availableNowOnly: false,
      sortBy: 'recommended',
      userTimezone,
    });
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] text-slate-900 font-sans flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Offline Status Banner */}
      {isOffline && (
        <div className="bg-amber-500 px-4 py-2 text-center text-xs font-bold text-white flex items-center justify-center gap-2">
          <WifiOff className="h-4 w-4" />
          <span>You are currently offline. Live slot booking requires an internet connection.</span>
        </div>
      )}

      {/* Global Bento Navigation Header */}
      <Header
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        bookingCount={bookings.filter((b) => b.status === 'confirmed').length}
        availableNowCount={availableNowCount}
        userTimezone={userTimezone}
        onTimezoneChange={(tz) => {
          setUserTimezone(tz);
          setFilters((f) => ({ ...f, userTimezone: tz }));
        }}
        onDownloadZip={() => setShowZipModal(true)}
      />

      {/* Main Container */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        {/* TAB 1: BROWSE EXPERTS & BOOKING */}
        {currentTab === 'browse' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Bento Hero Header Card */}
            <div className="rounded-[2.5rem] bg-white border border-slate-200 shadow-sm p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-xs font-black uppercase tracking-widest text-indigo-600">
                    Live On-Demand Consultations
                  </span>
                </div>
                <h1 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                  Connect 1:1 With Industry Leaders
                </h1>
                <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
                  Real-time slots, instant lock with atomicity, automated calendar invites, and verified advisors in AI, Immigration, Venture, and Tax.
                </p>
              </div>

              {/* Live Availability Bento Metric */}
              <div className="flex items-center gap-3 rounded-2xl bg-indigo-50/80 border border-indigo-100 p-4 shadow-sm shrink-0">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-500/30">
                  <Zap className="h-5 w-5 fill-white" />
                </div>
                <div>
                  <div className="text-sm font-black text-indigo-950">
                    {availableNowCount} Experts Live Now
                  </div>
                  <div className="text-xs text-indigo-700 font-medium">
                    Instant start in &lt; 15 mins
                  </div>
                </div>
              </div>
            </div>

            {/* Bento Filter & Search Controls */}
            <ExpertFilterBar
              categories={categories}
              selectedCategory={filters.category}
              onSelectCategory={(cat) => setFilters({ ...filters, category: cat })}
              search={filters.search}
              onSearchChange={(q) => setFilters({ ...filters, search: q })}
              availableNowOnly={filters.availableNowOnly}
              onToggleAvailableNow={() =>
                setFilters({ ...filters, availableNowOnly: !filters.availableNowOnly })
              }
              sortBy={filters.sortBy}
              onSortByChange={(sort) => setFilters({ ...filters, sortBy: sort })}
              totalResults={experts.length}
              availableNowCount={availableNowCount}
              onResetFilters={handleResetFilters}
            />

            {/* Error State */}
            {error && (
              <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-center text-xs text-rose-800 space-y-3">
                <AlertCircle className="h-8 w-8 text-rose-600 mx-auto" />
                <div>
                  <h3 className="text-sm font-bold">Failed to load expert advisors</h3>
                  <p className="mt-1 text-rose-700">{error}</p>
                </div>
                <button
                  onClick={fetchExperts}
                  className="inline-flex items-center gap-1.5 rounded-2xl bg-rose-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-rose-700 transition shadow-sm"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Retry Connection</span>
                </button>
              </div>
            )}

            {/* Loading Skeletons */}
            {loadingExperts && !error && (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((idx) => (
                  <div
                    key={idx}
                    className="animate-pulse rounded-3xl border border-slate-200 bg-white p-6 space-y-4 shadow-sm"
                  >
                    <div className="flex gap-4">
                      <div className="h-16 w-16 rounded-2xl bg-slate-200 shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-3/4 rounded bg-slate-200" />
                        <div className="h-3 w-1/2 rounded bg-slate-100" />
                        <div className="h-3 w-1/3 rounded bg-slate-100" />
                      </div>
                    </div>
                    <div className="h-12 w-full rounded-2xl bg-slate-100" />
                    <div className="h-10 w-full rounded-2xl bg-slate-200" />
                  </div>
                ))}
              </div>
            )}

            {/* Empty Search State */}
            {!loadingExperts && !error && experts.length === 0 && (
              <div className="rounded-[2.5rem] border border-dashed border-slate-200 bg-white p-14 text-center space-y-4 shadow-sm">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <Search className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">No advisors found</h3>
                  <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                    We couldn't find any verified experts matching your filter criteria. Try relaxing your filters or search keywords.
                  </p>
                </div>
                <button
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-6 py-3 text-xs font-bold text-white shadow-md hover:bg-slate-800 transition"
                >
                  <span>Reset All Filters</span>
                </button>
              </div>
            )}

            {/* Bento Grid layout */}
            {!loadingExperts && !error && experts.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* First expert featured if not heavily filtered or if available now */}
                {experts.map((expert, index) => {
                  const isFeatured = index === 0 && expert.isAvailableNow;
                  return (
                    <div
                      key={expert.id}
                      className={isFeatured ? 'col-span-1 md:col-span-2 lg:col-span-2' : 'col-span-1'}
                    >
                      <ExpertCard
                        expert={expert}
                        userTimezone={userTimezone}
                        featured={isFeatured}
                        onSelect={(exp) => setSelectedExpertForBooking(exp)}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* TAB 2: MY APPOINTMENTS HISTORY */}
        {currentTab === 'history' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <AppointmentsHistory
              bookings={bookings}
              loading={loadingBookings}
              userTimezone={userTimezone}
              onRefresh={fetchBookings}
              onBrowseExperts={() => setCurrentTab('browse')}
              onBookingUpdated={() => {
                fetchBookings();
                fetchExperts();
                fetchCategories();
              }}
            />
          </motion.div>
        )}

        {/* TAB 3: ARCHITECTURE SPECS & LIVE CONCURRENCY TESTER */}
        {currentTab === 'architecture' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <ArchitectureDocs
              onDatabaseReset={() => {
                fetchExperts();
                fetchCategories();
                fetchBookings();
              }}
            />
          </motion.div>
        )}
      </main>

      {/* Booking Checkout Modal */}
      {selectedExpertForBooking && (
        <BookingModal
          expert={selectedExpertForBooking}
          userTimezone={userTimezone}
          onClose={() => setSelectedExpertForBooking(null)}
          onBookingSuccess={(booking) => {
            handleBookingSuccess(booking);
          }}
        />
      )}

      {/* Download Zip Archive Modal */}
      {showZipModal && <ZipDownloadModal onClose={() => setShowZipModal(false)} />}

      {/* Floating Success Toast when session is booked */}
      <AnimatePresence>
        {recentBookingToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-emerald-300 bg-slate-900 p-4 text-white shadow-2xl"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white shrink-0">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">
                Session Booked: {recentBookingToast.confirmationCode}
              </div>
              <p className="text-[11px] text-slate-300">
                With {recentBookingToast.expert.name}
              </p>
            </div>
            <button
              onClick={() => {
                setRecentBookingToast(null);
                setCurrentTab('history');
              }}
              className="ml-2 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition"
            >
              View in History →
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
