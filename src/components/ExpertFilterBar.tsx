import {
  ArrowUpDown,
  Filter,
  Search,
  X,
  Zap,
} from 'lucide-react';
import React from 'react';
import { ExpertCategory } from '../types.js';

interface ExpertFilterBarProps {
  categories: Array<{ name: string; count: number }>;
  selectedCategory: ExpertCategory;
  onSelectCategory: (cat: ExpertCategory) => void;
  search: string;
  onSearchChange: (q: string) => void;
  availableNowOnly: boolean;
  onToggleAvailableNow: () => void;
  sortBy: string;
  onSortByChange: (sort: any) => void;
  totalResults: number;
  availableNowCount: number;
  onResetFilters: () => void;
}

export const ExpertFilterBar: React.FC<ExpertFilterBarProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  search,
  onSearchChange,
  availableNowOnly,
  onToggleAvailableNow,
  sortBy,
  onSortByChange,
  totalResults,
  availableNowCount,
  onResetFilters,
}) => {
  const hasActiveFilters =
    search.trim() !== '' ||
    selectedCategory !== 'All' ||
    availableNowOnly ||
    sortBy !== 'recommended';

  return (
    <div className="space-y-4">
      {/* Top Search & Controls Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search Box */}
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search experts by name, topic, or keyword (e.g. LLM, Visa, Seed, Tax)..."
            className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-11 pr-10 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10 shadow-sm"
          />
          {search && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Right Controls: Available Now Toggle + Sort Dropdown */}
        <div className="flex items-center gap-2.5">
          {/* Available Right Now Bento Switch */}
          <button
            onClick={onToggleAvailableNow}
            className={`flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-xs font-bold transition shadow-sm ${
              availableNowOnly
                ? 'border-emerald-500 bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <Zap
              className={`h-4 w-4 ${
                availableNowOnly ? 'text-white fill-white' : 'text-slate-400'
              }`}
            />
            <span>Available Now</span>
            {availableNowCount > 0 && (
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-extrabold ${
                  availableNowOnly
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {availableNowCount}
              </span>
            )}
          </button>

          {/* Sort Dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => onSortByChange(e.target.value)}
              className="cursor-pointer appearance-none rounded-2xl border border-slate-200 bg-white py-2.5 pl-4 pr-9 text-xs font-bold text-slate-700 hover:border-slate-300 focus:border-indigo-500 focus:outline-none shadow-sm"
            >
              <option value="recommended">Sort: Recommended</option>
              <option value="rating">Sort: Highest Rating</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="experience">Years of Experience</option>
            </select>
            <ArrowUpDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Category Bento Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.name;
          return (
            <button
              key={cat.name}
              onClick={() => onSelectCategory(cat.name as ExpertCategory)}
              className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold transition ${
                isSelected
                  ? 'bg-indigo-600 border border-indigo-600 text-white shadow-md'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 shadow-2xs'
              }`}
            >
              <span>{cat.name}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                  isSelected ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Filters Result Row */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <div>
          Showing <span className="font-bold text-slate-900">{totalResults}</span> expert
          {totalResults === 1 ? '' : 's'}
          {availableNowOnly && (
            <span className="text-emerald-700 font-bold"> · Available right now</span>
          )}
          {selectedCategory !== 'All' && (
            <span> in <strong className="text-slate-800 font-bold">{selectedCategory}</strong></span>
          )}
        </div>

        {hasActiveFilters && (
          <button
            onClick={onResetFilters}
            className="font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
          >
            Clear all filters
          </button>
        )}
      </div>
    </div>
  );
};

