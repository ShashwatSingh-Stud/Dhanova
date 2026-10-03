'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from './ThemeProvider';
import { clsx } from 'clsx';
import { useState } from 'react';

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/accounts',  label: 'Accounts' },
  { href: '/rings',     label: 'Rings & Graph' },
  { href: '/holds',     label: 'Holds & Audit' },
];

const PERIODS = ['24h', '7d', '30d'] as const;

export type Period = typeof PERIODS[number];

interface NavBarProps {
  period: Period;
  onPeriodChange: (p: Period) => void;
}

export function NavBar({ period, onPeriodChange }: NavBarProps) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  return (
    <nav
      className="flex items-center justify-between px-6 py-3 rounded-2xl"
      style={{ backgroundColor: 'var(--color-navy-dark)' }}
      role="navigation"
      aria-label="Main navigation"
    >
      {/* ── Logo + wordmark ── */}
      <Link href="/dashboard" className="flex items-center gap-2 shrink-0" aria-label="RakshaNet home">
        {/* Logo mark: a small teal shield icon inlined as SVG */}
        <svg
          width="28"
          height="28"
          viewBox="0 0 28 28"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M14 2L4 7v7c0 6 4.5 10.5 10 12 5.5-1.5 10-6 10-12V7L14 2Z"
            fill="var(--color-teal)"
          />
          <path
            d="M10 14l3 3 5-5"
            stroke="var(--color-navy-dark)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span
          className="text-base font-bold tracking-tight"
          style={{ color: '#FFFFFF' }}
        >
          RakshaNet
        </span>
      </Link>

      {/* ── Pill nav tabs ── */}
      <div className="flex items-center gap-1 rounded-full px-1 py-1" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
        {NAV_LINKS.map(({ href, label }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2',
                isActive
                  ? 'text-white border border-[--color-teal] shadow-[0_0_8px_var(--color-teal-bright)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/10',
              )}
              style={isActive ? { borderColor: 'var(--color-teal)' } : {}}
              aria-current={isActive ? 'page' : undefined}
            >
              {label}
            </Link>
          );
        })}
      </div>

      {/* ── Right controls ── */}
      <div className="flex items-center gap-4">
        {/* Period selector */}
        <div
          className="flex items-center rounded-full px-1 py-1 gap-0.5"
          style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
          role="group"
          aria-label="Time range"
        >
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => onPeriodChange(p)}
              className={clsx(
                'px-3 py-1 rounded-full text-xs font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-1',
                period === p
                  ? 'text-white font-bold'
                  : 'text-slate-400 hover:text-white',
              )}
              style={period === p ? { color: 'var(--color-teal-bright)' } : {}}
              aria-pressed={period === p}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors focus-visible:outline-2 focus-visible:outline-offset-1"
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
        >
          {theme === 'light' ? (
            <MoonIcon />
          ) : (
            <SunIcon />
          )}
        </button>
      </div>
    </nav>
  );
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M13.5 10A5.5 5.5 0 0 1 6 2.5a.5.5 0 0 0-.6-.6A6 6 0 1 0 14.1 10.6a.5.5 0 0 0-.6-.6Z"
        fill="currentColor"
      />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="3" fill="currentColor" />
      <path
        d="M8 1v2M8 13v2M1 8h2m10 0h2M3.1 3.1l1.4 1.4m7 7 1.4 1.4M3.1 12.9l1.4-1.4m7-7 1.4-1.4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
