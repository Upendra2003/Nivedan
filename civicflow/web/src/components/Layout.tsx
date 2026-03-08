import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { api } from "../services/api";

// ── Icons ─────────────────────────────────────────────────────────────────────

const HomeIcon = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);
const FolderIcon = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
  </svg>
);
const BellIcon = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
  </svg>
);
const UserIcon = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" />
  </svg>
);
const SunIcon = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);
const MoonIcon = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
  </svg>
);

// ── Nav items ─────────────────────────────────────────────────────────────────

interface NavItem { label: string; path: string; icon: React.ReactNode; }

const NAV: NavItem[] = [
  { label: "Dashboard", path: "/dashboard", icon: <HomeIcon /> },
  { label: "My Cases",  path: "/dashboard", icon: <FolderIcon /> },
  { label: "Notifications", path: "/notifications", icon: <BellIcon /> },
  { label: "Profile",   path: "/profile",   icon: <UserIcon /> },
];

// ── Layout ────────────────────────────────────────────────────────────────────

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [notifCount, setNotifCount] = useState(0);

  useEffect(() => {
    api.get<any[]>("/notifications/mine")
      .then((n) => setNotifCount(n.length))
      .catch(() => {});
  }, [location.pathname]);

  const initials = (user?.name ?? "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      {/* ── Topbar ─────────────────────────────────────────────────────── */}
      <header className="h-14 flex-shrink-0 flex items-center justify-between px-6 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 z-10">
        <span className="text-xl font-extrabold tracking-tight text-blue-600 dark:text-blue-400">
          CivicFlow
        </span>

        <div className="flex items-center gap-3">
          {/* Dark/light toggle */}
          <button
            onClick={toggle}
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            title={dark ? "Switch to light" : "Switch to dark"}
          >
            {dark ? <SunIcon /> : <MoonIcon />}
          </button>

          {/* User avatar + name */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
              {initials}
            </div>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300 hidden sm:block">
              {user?.name}
            </span>
            <button
              onClick={() => { logout(); navigate("/login"); }}
              className="text-xs text-slate-400 hover:text-red-500 transition-colors ml-1"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* ── Body ───────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-56 flex-shrink-0 flex flex-col bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 overflow-y-auto">
          <nav className="flex flex-col gap-1 p-3 flex-1">
            {NAV.map((item) => {
              const active = location.pathname === item.path && item.path !== "/profile";
              return (
                <Link
                  key={item.label}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                  }`}
                >
                  <span className={active ? "text-blue-600 dark:text-blue-400" : ""}>{item.icon}</span>
                  <span>{item.label}</span>
                  {item.label === "Notifications" && notifCount > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                      {notifCount > 9 ? "9+" : notifCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
