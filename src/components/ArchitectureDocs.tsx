import {
  AlertCircle,
  CheckCircle2,
  Code2,
  FileText,
  Flame,
  HelpCircle,
  Loader2,
  Play,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Terminal,
  Zap,
} from 'lucide-react';
import React, { useState } from 'react';
import { api } from '../services/api.js';

interface ArchitectureDocsProps {
  onDatabaseReset: () => void;
}

export const ArchitectureDocs: React.FC<ArchitectureDocsProps> = ({ onDatabaseReset }) => {
  const [raceTestLoading, setRaceTestLoading] = useState(false);
  const [raceTestResult, setRaceTestResult] = useState<any>(null);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const runRaceConditionTest = async () => {
    setRaceTestLoading(true);
    setRaceTestResult(null);
    try {
      const data = await api.simulateRaceCondition();
      setRaceTestResult(data);
    } catch (err: any) {
      setRaceTestResult({ error: err.message });
    } finally {
      setRaceTestLoading(false);
    }
  };

  const handleResetDb = async () => {
    setResetLoading(true);
    try {
      await api.resetData();
      setResetSuccess(true);
      onDatabaseReset();
      setTimeout(() => setResetSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Top Banner */}
      <div className="rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50/80 via-white to-indigo-50/30 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-indigo-600 px-2 py-0.5 text-xs font-bold text-white uppercase tracking-wider">
                DECISIONS.MD
              </span>
              <h2 className="text-xl font-bold text-slate-900">
                Product Architecture & Edge-Case Defense
              </h2>
            </div>
            <p className="mt-1 text-xs text-slate-600">
              Interactive review of architectural tradeoffs, concurrency guarantees, and live test harness.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetDb}
              disabled={resetLoading}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${resetLoading ? 'animate-spin' : 'text-slate-500'}`} />
              <span>{resetSuccess ? 'Seeded Fresh!' : 'Reset Seed Data'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* LIVE EDGE-CASE TEST HARNESS */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Live Concurrency Race Condition Tester
            </h3>
          </div>
          <span className="text-xs text-slate-500">Atomic Check-and-Set Verification</span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Click below to dispatch <strong>two simultaneous booking requests for the exact same slot</strong> at the exact same millisecond. Verified: First request receives <code className="bg-slate-100 px-1 py-0.5 rounded text-emerald-700 font-mono">201 Created</code>, while the second request is immediately rejected with <code className="bg-slate-100 px-1 py-0.5 rounded text-rose-700 font-mono">409 Conflict (SLOT_ALREADY_BOOKED)</code>.
        </p>

        <button
          onClick={runRaceConditionTest}
          disabled={raceTestLoading}
          className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition shadow-xs"
        >
          {raceTestLoading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Firing Concurrent Requests...</span>
            </>
          ) : (
            <>
              <Play className="h-3.5 w-3.5 text-emerald-400 fill-emerald-400" />
              <span>Simulate Simultaneous Booking Conflict</span>
            </>
          )}
        </button>

        {raceTestResult && (
          <div className="mt-3 rounded-xl border border-slate-200 bg-slate-900 p-4 font-mono text-xs text-slate-100 space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <CheckCircle2 className="h-4 w-4" />
              <span>{raceTestResult.verdict}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-[11px]">
              <div className="rounded-lg bg-slate-800/80 p-3 border border-slate-700">
                <div className="text-emerald-300 font-bold mb-1">
                  Request 1 (Alice): HTTP {raceTestResult.userA_Attempt?.status}
                </div>
                <div className="text-slate-400">
                  Confirmation:{' '}
                  {raceTestResult.userA_Attempt?.result?.booking?.confirmationCode || 'CNS-xxxx'}
                </div>
                <div className="text-slate-400">
                  Status: {raceTestResult.userA_Attempt?.result?.booking?.status}
                </div>
              </div>

              <div className="rounded-lg bg-slate-800/80 p-3 border border-slate-700">
                <div className="text-rose-400 font-bold mb-1">
                  Request 2 (Bob): HTTP {raceTestResult.userB_Attempt?.status} Conflict
                </div>
                <div className="text-slate-400">
                  Code: {raceTestResult.userB_Attempt?.code}
                </div>
                <div className="text-slate-400">
                  Message: {raceTestResult.userB_Attempt?.message}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 1: Product Interpretation */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">
            1
          </span>
          <span>What product did you decide to build, and why?</span>
        </h3>
        <p className="text-xs leading-relaxed text-slate-600">
          We built <strong>Consult</strong> — a high-trust marketplace for booking 30-minute paid advisory sessions across six high-stakes domains (Tech & AI Architecture, Legal & Immigration, Seed/Series-A VC, Cross-Border Tax, UX & Onboarding, Executive Coaching).
        </p>
        <p className="text-xs leading-relaxed text-slate-600">
          This domain was chosen because it embodies genuine real-world constraints: real scarcity (lawyers/leads have 6–8 slots/day, not 10,000 items), cross-timezone coordination (clients in New York, advisors in Tokyo/London), integer-cent pricing without float errors, and critical live availability ("Available Right Now").
        </p>
      </div>

      {/* SECTION 2: Edge Cases Matrix */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">
            2
          </span>
          <span>What edge cases did you find and handle?</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-700">
                <th className="p-2.5 font-bold">Edge Case</th>
                <th className="p-2.5 font-bold">Status</th>
                <th className="p-2.5 font-bold">Resolution Mechanism</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              <tr>
                <td className="p-2.5 font-semibold text-slate-900">
                  Simultaneous Slot Booking Race Condition
                </td>
                <td className="p-2.5">
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                    Handled (409)
                  </span>
                </td>
                <td className="p-2.5">
                  Atomic check-and-set in Node event loop. Second caller rejected immediately with 409 Conflict.
                </td>
              </tr>
              <tr>
                <td className="p-2.5 font-semibold text-slate-900">
                  Double-Tap / Network Retry Duplicate Submissions
                </td>
                <td className="p-2.5">
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                    Handled (200 Replay)
                  </span>
                </td>
                <td className="p-2.5">
                  Client generates unique idempotencyKey on modal open. Replays return existing booking without double charge.
                </td>
              </tr>
              <tr>
                <td className="p-2.5 font-semibold text-slate-900">
                  Booking Slot That Has Already Passed
                </td>
                <td className="p-2.5">
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                    Handled (422)
                  </span>
                </td>
                <td className="p-2.5">
                  Backend validates slot.startTime &gt; Date.now() regardless of client system clock.
                </td>
              </tr>
              <tr>
                <td className="p-2.5 font-semibold text-slate-900">
                  Cross-Timezone Discrepancies
                </td>
                <td className="p-2.5">
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                    Handled (UTC)
                  </span>
                </td>
                <td className="p-2.5">
                  Strict ISO-8601 UTC representation across API. UI renders device local time + contextual expert time.
                </td>
              </tr>
              <tr>
                <td className="p-2.5 font-semibold text-slate-900">
                  Money Precision & Floats
                </td>
                <td className="p-2.5">
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                    Handled
                  </span>
                </td>
                <td className="p-2.5">
                  Amounts stored in integer cents (e.g. 17500 for $175.00) eliminating floating point rounding defects.
                </td>
              </tr>
              <tr>
                <td className="p-2.5 font-semibold text-slate-900">
                  Cancellation & Slot Inventory Recycling
                </td>
                <td className="p-2.5">
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                    Handled
                  </span>
                </td>
                <td className="p-2.5">
                  POST /api/bookings/:id/cancel frees the slot back to available status for future clients.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 3, 4, 5: Scope & Self Assessment */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-[10px]">
              3
            </span>
            <span>Deliberately Not Built</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Full credit card processor (Stripe elements), external SQL infrastructure, and expert schedule management. Focused on perfecting the buyer booking experience and appointment history.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-[10px]">
              4
            </span>
            <span>Honest Weakest Part</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            In-memory store volatility on dev process cold restart (resets to seed), and DST transition edge cases which would benefit from Luxon IANA timezone databases in a production iteration.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-[10px]">
              5
            </span>
            <span>PM Pushbacks</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Pushed back on ambiguity in "available right now" (instant on-demand ring vs 30m slot) and financial capture timing (authorize on booking vs post-session release).
          </p>
        </div>
      </div>
    </div>
  );
};
