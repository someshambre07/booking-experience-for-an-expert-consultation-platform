import { Expert, TimeSlot } from './types.js';

export function generateSeedData(): { experts: Expert[]; slots: TimeSlot[] } {
  const now = Date.now();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  const rawExperts: Omit<Expert, 'id'>[] = [
    {
      name: 'Dr. Elena Rostova',
      title: 'Principal AI Architect & LLM Systems Lead',
      company: 'Ex-Google Brain / DeepTech Advisory',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80',
      category: 'Tech & AI',
      bio: '12+ years building enterprise neural search, agentic pipelines, and high-throughput GPU infrastructure. Advising Fortune 500 engineering leaders and AI founders on production LLM deployment.',
      rating: 4.98,
      reviewCount: 142,
      ratePerSessionCents: 17500, // $175.00
      currency: 'USD',
      timezone: 'America/San_Francisco',
      timezoneOffsetHours: -7,
      languages: ['English', 'German'],
      yearsExperience: 14,
      topics: ['LLM Inference Optimization', 'Agent Architecture', 'Vector DB Scaling', 'AI Team Hiring']
    },
    {
      name: 'Marcus Vance, Esq.',
      title: 'Senior Tech & Immigration Counsel',
      company: 'Vance Legal Partners LLP',
      avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&auto=format&fit=crop&q=80',
      category: 'Legal & Immigration',
      bio: 'Specialized in O-1A extraordinary ability, EB-1, H-1B cap exemptions, and cross-border startup incorporation for technical founders and researchers.',
      rating: 4.95,
      reviewCount: 98,
      ratePerSessionCents: 19500, // $195.00
      currency: 'USD',
      timezone: 'America/New_York',
      timezoneOffsetHours: -4,
      languages: ['English', 'Spanish'],
      yearsExperience: 12,
      topics: ['O-1A Visa Strategy', 'Founder Equity Vesting', 'Delaware C-Corp Setup', 'IP Assignment']
    },
    {
      name: 'Aisha Al-Mansoor',
      title: 'Partner & Seed-Stage Lead',
      company: 'Horizon Seed Capital',
      avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80',
      category: 'Startup & VC',
      bio: 'Invested in 40+ early-stage B2B SaaS & FinTech startups. Evaluating pitch decks, unit economics, cap table health, and fundraising narratives for Pre-Seed to Series A rounds.',
      rating: 4.92,
      reviewCount: 86,
      ratePerSessionCents: 16000, // $160.00
      currency: 'USD',
      timezone: 'Europe/London',
      timezoneOffsetHours: 1,
      languages: ['English', 'Arabic', 'French'],
      yearsExperience: 10,
      topics: ['Pitch Deck Roast', 'Cap Table Modeling', 'SAFE vs Priced Rounds', 'Go-To-Market GTM']
    },
    {
      name: 'Devon Takahashi, CPA',
      title: 'International Tax & Crypto Wealth Strategist',
      company: 'Takahashi Global Advisory',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
      category: 'Tax & Accounting',
      bio: 'Cross-border tax optimization for remote workers, digital nomads, RSUs/options exercises (83b elections), and high-net-worth portfolio accounting.',
      rating: 4.97,
      reviewCount: 119,
      ratePerSessionCents: 14000, // $140.00
      currency: 'USD',
      timezone: 'Asia/Tokyo',
      timezoneOffsetHours: 9,
      languages: ['English', 'Japanese'],
      yearsExperience: 15,
      topics: ['83(b) Elections', 'QSBS Tax Exemption', 'Remote Contractor Taxes', 'Crypto Basis Tracking']
    },
    {
      name: 'Chloe Lin',
      title: 'Design Director & Fractional CPO',
      company: 'Form & Flow Studio (Ex-Airbnb)',
      avatarUrl: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=300&auto=format&fit=crop&q=80',
      category: 'Product & UX',
      bio: 'Helped 15+ YC-backed companies reach product-market fit through rapid user onboarding audits, design system architecture, and conversion funnel UX overhauls.',
      rating: 4.96,
      reviewCount: 77,
      ratePerSessionCents: 13000, // $130.00
      currency: 'USD',
      timezone: 'America/Los_Angeles',
      timezoneOffsetHours: -7,
      languages: ['English', 'Mandarin'],
      yearsExperience: 9,
      topics: ['Onboarding Teardown', 'Activation Funnel', 'Design Systems', 'UX Usability Audits']
    },
    {
      name: 'Arthur Pendelton',
      title: 'Executive Coach & Former VP of Engineering',
      company: 'Apex Leadership Group',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
      category: 'Career Coaching',
      bio: 'Coached 200+ Staff+ engineers and directors through career transitions, executive presence, difficult peer conflicts, and compensation negotiations ($500k+ packages).',
      rating: 4.99,
      reviewCount: 210,
      ratePerSessionCents: 18500, // $185.00
      currency: 'USD',
      timezone: 'America/Chicago',
      timezoneOffsetHours: -5,
      languages: ['English'],
      yearsExperience: 18,
      topics: ['Staff+ Promotion', 'Executive Negotiation', 'Managing Up', 'Engineering Org Design']
    }
  ];

  const experts: Expert[] = rawExperts.map((exp, idx) => ({
    id: `exp-${idx + 1}`,
    ...exp
  }));

  const slots: TimeSlot[] = [];

  // Generate slots for each expert relative to runtime
  experts.forEach((expert, expIdx) => {
    let slotCounter = 1;

    // 1. "Available Right Now" slots (within 10-25 mins from now) for select experts (exp-1, exp-2, exp-5)
    if ([0, 1, 4].includes(expIdx)) {
      const liveStart = new Date(now + 12 * minute);
      // round to next clean 5 min
      liveStart.setSeconds(0, 0);
      const liveEnd = new Date(liveStart.getTime() + 30 * minute);

      slots.push({
        id: `slot-${expert.id}-${slotCounter++}`,
        expertId: expert.id,
        startTime: liveStart.toISOString(),
        endTime: liveEnd.toISOString(),
        durationMinutes: 30,
        status: 'available'
      });
    }

    // 2. Later today slots
    [2, 4, 6].forEach((hoursAhead) => {
      const s = new Date(now + hoursAhead * hour);
      s.setMinutes(0, 0, 0);
      const e = new Date(s.getTime() + 30 * minute);
      slots.push({
        id: `slot-${expert.id}-${slotCounter++}`,
        expertId: expert.id,
        startTime: s.toISOString(),
        endTime: e.toISOString(),
        durationMinutes: 30,
        status: 'available'
      });
    });

    // 3. Tomorrow slots (morning & afternoon)
    [9, 11, 14, 16].forEach((hourOfDay) => {
      const tomorrow = new Date(now + 1 * day);
      tomorrow.setHours(hourOfDay, 0, 0, 0);
      const end = new Date(tomorrow.getTime() + 30 * minute);
      slots.push({
        id: `slot-${expert.id}-${slotCounter++}`,
        expertId: expert.id,
        startTime: tomorrow.toISOString(),
        endTime: end.toISOString(),
        durationMinutes: 30,
        status: 'available'
      });
    });

    // 4. Day after tomorrow slots
    [10, 13, 15, 17].forEach((hourOfDay) => {
      const day2 = new Date(now + 2 * day);
      day2.setHours(hourOfDay, 0, 0, 0);
      const end = new Date(day2.getTime() + 30 * minute);
      slots.push({
        id: `slot-${expert.id}-${slotCounter++}`,
        expertId: expert.id,
        startTime: day2.toISOString(),
        endTime: end.toISOString(),
        durationMinutes: 30,
        status: 'available'
      });
    });

    // 5. Deliberate past slot (for testing the past-slot validation edge case)
    const pastStart = new Date(now - 2 * hour);
    const pastEnd = new Date(pastStart.getTime() + 30 * minute);
    slots.push({
      id: `slot-${expert.id}-past`,
      expertId: expert.id,
      startTime: pastStart.toISOString(),
      endTime: pastEnd.toISOString(),
      durationMinutes: 30,
      status: 'available' // deliberate: status says available, but time is past
    });
  });

  return { experts, slots };
}
