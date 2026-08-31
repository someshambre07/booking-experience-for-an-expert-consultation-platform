import {
  Award,
  Briefcase,
  CheckCircle2,
  Clock,
  Globe2,
  Sparkles,
  Star,
  Zap,
} from 'lucide-react';
import React from 'react';
import { Expert } from '../types.js';
import {
  formatCentsToCurrency,
  formatRelativeStartsIn,
  formatSlotTime,
} from '../utils/formatters.js';

interface ExpertCardProps {
  expert: Expert;
  userTimezone: string;
  onSelect: (expert: Expert) => void;
  featured?: boolean;
}

export const ExpertCard: React.FC<ExpertCardProps> = ({
  expert,
  userTimezone,
  onSelect,
  featured = false,
}) => {
  const isAvailableNow = expert.isAvailableRightNow;
  const nextSlot = expert.nextAvailableSlot;

  if (featured) {
    return (
      <div className="group relative col-span-1 md:col-span-2 lg:col-span-3 flex flex-col md:flex-row gap-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md hover:border-indigo-300">
        {/* Top-Right Bento Available Badge */}
        {isAvailableNow ? (
          <div className="absolute top-0 right-0 px-5 py-2 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-bl-2xl shadow-xs flex items-center gap-1.5 z-10">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-white"></span>
            </span>
            <span>Available Now</span>
          </div>
        ) : (
          <div className="absolute top-0 right-0 px-5 py-2 bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase tracking-wider rounded-bl-2xl border-l border-b border-indigo-100/50 z-10">
            Featured Advisor
          </div>
        )}

        {/* Large Bento Avatar */}
        <div className="shrink-0 flex items-start">
          <img
            src={expert.avatarUrl}
            alt={expert.name}
            referrerPolicy="no-referrer"
            className="h-28 w-28 md:h-32 md:w-32 rounded-[2rem] bg-indigo-50 border-4 border-white shadow-md object-cover ring-1 ring-slate-100"
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col justify-between py-0.5">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap pr-28">
              <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase rounded-md tracking-wider">
                {expert.category}
              </span>
              <span className="flex items-center gap-1 text-xs font-bold text-amber-500">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span>{expert.rating.toFixed(2)}</span>
                <span className="font-normal text-slate-400">({expert.reviewCount} reviews)</span>
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs text-slate-500 font-medium">{expert.yearsExperience}y exp</span>
            </div>

            <h3 className="text-xl md:text-2xl font-bold text-slate-900 group-hover:text-indigo-600 transition">
              {expert.name}
            </h3>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              {expert.title} · <span className="text-slate-700 font-bold">{expert.company}</span>
            </p>
            <p className="text-slate-500 text-xs sm:text-sm leading-relaxed max-w-2xl mt-2 line-clamp-2">
              {expert.bio}
            </p>

            {/* Topic Badges */}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {expert.topics.map((topic, i) => (
                <span
                  key={i}
                  className="rounded-lg bg-slate-50 border border-slate-200/70 px-2.5 py-0.5 text-[11px] font-medium text-slate-600"
                >
                  {topic}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-100">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">
                {formatCentsToCurrency(expert.ratePerSessionCents, expert.currency)}
              </span>
              <span className="text-xs font-normal text-slate-400">/ 30 min session</span>
              {nextSlot && (
                <span className="ml-2 text-xs font-medium text-emerald-600">
                  • Next: {formatSlotTime(nextSlot.startTime, userTimezone)}
                </span>
              )}
            </div>

            <button
              onClick={() => onSelect(expert)}
              className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold text-xs sm:text-sm hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200 active:scale-[0.98] flex items-center justify-center gap-2 shrink-0"
            >
              {isAvailableNow ? <Zap className="h-4 w-4 fill-white" /> : <Sparkles className="h-4 w-4" />}
              <span>{isAvailableNow ? 'Book & Connect Now' : 'Book Consultation'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Standard Bento Card
  return (
    <div className="group relative flex flex-col justify-between rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-indigo-300 hover:shadow-md overflow-hidden">
      {/* Top Right Live Badge if Available */}
      {isAvailableNow && (
        <div className="absolute top-0 right-0 px-3.5 py-1.5 bg-emerald-500 text-white text-[9px] font-black uppercase tracking-[0.18em] rounded-bl-2xl shadow-xs flex items-center gap-1 z-10">
          <Zap className="h-2.5 w-2.5 fill-white" />
          <span>Live Now</span>
        </div>
      )}

      {/* Card Header: Avatar & Rating */}
      <div>
        <div className="flex items-start justify-between">
          <img
            src={expert.avatarUrl}
            alt={expert.name}
            referrerPolicy="no-referrer"
            className="w-16 h-16 rounded-2xl bg-indigo-50 border-2 border-white shadow-sm object-cover ring-1 ring-slate-100"
          />
          <div className={`flex items-center gap-1 text-xs font-bold text-amber-600 ${isAvailableNow ? 'pr-20' : ''}`}>
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>{expert.rating.toFixed(1)}</span>
            <span className="text-[10px] text-slate-400 font-normal">({expert.reviewCount})</span>
          </div>
        </div>

        {/* Info */}
        <div className="mt-3.5">
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold uppercase rounded-md tracking-wider">
              {expert.category}
            </span>
          </div>
          <h4 className="mt-1 font-bold text-slate-900 text-base group-hover:text-indigo-600 transition">
            {expert.name}
          </h4>
          <p className="text-xs text-slate-400 font-medium mb-1 line-clamp-1">
            {expert.title} · {expert.company}
          </p>
          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mt-2">
            {expert.bio}
          </p>
        </div>

        {/* Topics */}
        <div className="mt-3 flex flex-wrap gap-1">
          {expert.topics.slice(0, 2).map((topic, i) => (
            <span
              key={i}
              className="rounded-md bg-slate-50 border border-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600"
            >
              {topic}
            </span>
          ))}
          {expert.topics.length > 2 && (
            <span className="rounded-md bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-400">
              +{expert.topics.length - 2}
            </span>
          )}
        </div>
      </div>

      {/* Card Footer: Price and Action */}
      <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-base font-bold text-slate-900">
            {formatCentsToCurrency(expert.ratePerSessionCents, expert.currency)}
            <span className="text-[10px] font-normal text-slate-400">/30m</span>
          </span>
          {nextSlot ? (
            <span className="text-[10px] text-slate-400 truncate max-w-[130px]">
              {formatSlotTime(nextSlot.startTime, userTimezone)}
            </span>
          ) : (
            <span className="text-[10px] text-slate-400">No open slots</span>
          )}
        </div>

        <button
          onClick={() => onSelect(expert)}
          title="Book Consultation"
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 text-slate-800 font-bold text-xs rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-xs"
        >
          {isAvailableNow ? (
            <>
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Connect</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span>Book</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

