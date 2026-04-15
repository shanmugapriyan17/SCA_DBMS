/**
 * @file navigation.tsx
 * @description Main navigation bar — responsive, dark/light aware,
 *              with premium theme toggle pill and mobile drawer.
 */

import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ThemeToggle } from './ThemeToggle';

interface NavigationProps {
  isAuthenticated: boolean;
  onLogout?: () => void;
}

export function Navigation({ isAuthenticated, onLogout }: NavigationProps) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  /* ── Collapse mobile menu on route change ── */
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  /* ── Elevate nav on scroll ── */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isActive = (path: string) => location.pathname === path;

  const linkCls = (path: string) =>
    `text-sm font-medium transition-colors duration-200 ${
      isActive(path)
        ? 'text-primary dark:text-purple-400'
        : 'text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-purple-300'
    }`;

  const mobileLinkCls = (path: string) =>
    `flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
      isActive(path)
        ? 'bg-primary/10 dark:bg-purple-500/15 text-primary dark:text-purple-300'
        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-primary dark:hover:text-purple-300'
    }`;

  return (
    <>
      {/* ══════════════════════════ NAV BAR ══════════════════════════ */}
      <nav
        className={`sticky top-0 z-50 w-full glass-nav border-b
          ${scrolled
            ? 'border-slate-200/80 dark:border-purple-900/50 shadow-sm dark:shadow-purple-950/40'
            : 'border-slate-200/40 dark:border-purple-900/20'
          }
          transition-all duration-300`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">

            {/* ── Logo ── */}
            <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
              <div className="
                flex items-center justify-center
                w-9 h-9 rounded-xl
                bg-primary/10 dark:bg-purple-500/20
                transition-colors duration-300
              ">
                <span className="material-icons text-primary dark:text-purple-400 text-xl">psychology</span>
              </div>
              <span className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Smart<span className="text-primary dark:text-purple-400">Career</span>
              </span>
            </Link>

            {/* ── Desktop links ── */}
            <div className="hidden md:flex items-center gap-6 lg:gap-8">
              {isAuthenticated ? (
                <>
                  <Link to="/dashboard"   className={linkCls('/dashboard')}>Dashboard</Link>
                  <Link to="/skills"      className={linkCls('/skills')}>Assessments</Link>
                  <Link to="/results"     className={linkCls('/results')}>Results</Link>
                  <Link to="/assessments" className={linkCls('/assessments')}>Manage</Link>
                  <Link to="/careers"     className={linkCls('/careers')}>Careers</Link>
                </>
              ) : (
                <>
                  <Link to="/"            className={linkCls('/')}>Home</Link>
                  <a href="/#how-it-works" className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-purple-300 transition-colors">How It Works</a>
                  <a href="/#features"     className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-purple-300 transition-colors">Features</a>
                  <Link to="/login"       className={linkCls('/login')}>Login</Link>
                </>
              )}
            </div>

            {/* ── Right actions ── */}
            <div className="flex items-center gap-3">

              {/* Theme toggle pill — desktop */}
              <div className="hidden sm:block">
                <ThemeToggle />
              </div>

              {/* Theme toggle compact — always visible on xs when menu closed */}
              <div className="sm:hidden">
                <ThemeToggle compact />
              </div>

              {/* Auth CTA */}
              {!isAuthenticated && (
                <Link
                  to="/signup"
                  className="
                    hidden md:inline-flex items-center justify-center
                    px-5 py-2 text-sm font-semibold rounded-full
                    text-white bg-primary hover:bg-primary-hover
                    dark:bg-purple-600 dark:hover:bg-purple-500
                    shadow-sm hover:shadow-md hover:shadow-primary/25 dark:hover:shadow-purple-600/30
                    transition-all duration-200
                  "
                >
                  Get Started
                </Link>
              )}

              {/* Logout — desktop */}
              {isAuthenticated && (
                <button
                  onClick={onLogout}
                  title="Logout"
                  className="
                    hidden md:flex items-center gap-1.5
                    px-3 py-2 rounded-lg text-sm font-medium
                    text-slate-500 dark:text-slate-400
                    hover:text-red-500 dark:hover:text-red-400
                    hover:bg-red-50 dark:hover:bg-red-900/20
                    transition-all duration-200
                  "
                >
                  <span className="material-icons text-sm">logout</span>
                  <span className="hidden lg:inline">Logout</span>
                </button>
              )}

              {/* Hamburger — mobile */}
              <button
                id="mobile-menu-btn"
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={mobileMenuOpen}
                onClick={() => setMobileMenuOpen(v => !v)}
                className="
                  md:hidden flex items-center justify-center
                  w-9 h-9 rounded-xl
                  text-slate-600 dark:text-slate-300
                  hover:bg-slate-100 dark:hover:bg-white/10
                  transition-all duration-200
                "
              >
                <span className="material-icons text-xl">
                  {mobileMenuOpen ? 'close' : 'menu'}
                </span>
              </button>
            </div>

          </div>
        </div>
      </nav>

      {/* ══════════════════════ MOBILE DRAWER ════════════════════════ */}
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 md:hidden transition-all duration-300 ${
          mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)' }}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        className={`
          fixed top-0 right-0 z-50 md:hidden
          h-full w-72 max-w-[85vw]
          bg-white dark:bg-surface-dark
          shadow-2xl dark:shadow-purple-950/60
          transform transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]
          ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}
          flex flex-col
          border-l border-slate-100 dark:border-purple-900/40
        `}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-purple-900/40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 dark:bg-purple-500/20 flex items-center justify-center">
              <span className="material-icons text-primary dark:text-purple-400 text-lg">psychology</span>
            </div>
            <span className="font-bold text-slate-900 dark:text-white text-sm">Smart Career Advisor</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-all"
          >
            <span className="material-icons text-xl">close</span>
          </button>
        </div>

        {/* Drawer links */}
        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          {isAuthenticated ? (
            <>
              <Link to="/dashboard"   className={mobileLinkCls('/dashboard')}   onClick={() => setMobileMenuOpen(false)}>
                <span className="material-icons text-base">dashboard</span> Dashboard
              </Link>
              <Link to="/skills"      className={mobileLinkCls('/skills')}      onClick={() => setMobileMenuOpen(false)}>
                <span className="material-icons text-base">quiz</span> Assessments
              </Link>
              <Link to="/results"     className={mobileLinkCls('/results')}     onClick={() => setMobileMenuOpen(false)}>
                <span className="material-icons text-base">analytics</span> Results
              </Link>
              <Link to="/assessments" className={mobileLinkCls('/assessments')} onClick={() => setMobileMenuOpen(false)}>
                <span className="material-icons text-base">settings</span> Manage
              </Link>
              <Link to="/careers"     className={mobileLinkCls('/careers')}     onClick={() => setMobileMenuOpen(false)}>
                <span className="material-icons text-base">work_outline</span> Careers
              </Link>
            </>
          ) : (
            <>
              <Link to="/"   className={mobileLinkCls('/')}   onClick={() => setMobileMenuOpen(false)}>
                <span className="material-icons text-base">home</span> Home
              </Link>
              <a href="/#how-it-works" className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-all" onClick={() => setMobileMenuOpen(false)}>
                <span className="material-icons text-base">info_outline</span> How It Works
              </a>
              <a href="/#features" className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-all" onClick={() => setMobileMenuOpen(false)}>
                <span className="material-icons text-base">star_outline</span> Features
              </a>
              <Link to="/login"  className={mobileLinkCls('/login')}  onClick={() => setMobileMenuOpen(false)}>
                <span className="material-icons text-base">login</span> Login
              </Link>
            </>
          )}
        </nav>

        {/* Drawer footer */}
        <div className="px-4 py-4 border-t border-slate-100 dark:border-purple-900/40 space-y-3">
          {/* Full toggle in drawer */}
          <div className="flex justify-center py-1">
            <ThemeToggle />
          </div>

          {isAuthenticated ? (
            <button
              onClick={() => { onLogout?.(); setMobileMenuOpen(false); }}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all"
            >
              <span className="material-icons text-base">logout</span> Logout
            </button>
          ) : (
            <Link
              to="/signup"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-primary dark:bg-purple-600 hover:bg-primary-hover dark:hover:bg-purple-500 shadow-sm transition-all"
            >
              <span className="material-icons text-base">rocket_launch</span> Get Started Free
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
