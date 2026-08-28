"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  CalendarDays,
  UserPlus,
  ClipboardCheck,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X
} from "lucide-react";

import styles from "./AppShell.module.css";

const items = [
  ["Dashboard", "/admin", LayoutDashboard],
  ["Students", "/admin/students", Users],
  ["Teachers", "/admin/teachers", GraduationCap],
  ["Courses", "/admin/courses", BookOpen],
  ["Enrollments", "/admin/enrollments", UserPlus],
  ["Schedule", "/admin/schedule", CalendarDays],
  ["Attendance", "/admin/attendance", ClipboardCheck],
  ["Payments", "/admin/payments", CreditCard],
  ["Reports", "/admin/reports", BarChart3],
  ["Settings", "/admin/settings", Settings],
];

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function AppShell({ children, role = "Admin" }) {
  const pathname = usePathname();
  const router = useRouter();

  const [open, setOpen] = React.useState(false);
  const [signingOut, setSigningOut] = React.useState(false);

  async function handleSignOut() {
    if (signingOut) return;

    setSigningOut(true);

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Sign out error:", error);
      setSigningOut(false);
      alert("Unable to sign out. Please try again.");
      return;
    }

    router.replace("/login");
    router.refresh();
  }

  return (
    <div className={styles.shell}>

      {open && (
        <button
          className={styles.overlay}
          aria-label="Close menu"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`${styles.sidebar} ${
          open ? styles.sidebarOpen : ""
        }`}
      >

        <div className={styles.brand}>
          <div className={styles.logo}>AQ</div>

          <div>
            <strong>Al Shaimaa</strong>
            <span>Academy System</span>
          </div>

          <button
            className={styles.closeMenu}
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav className={styles.navigation}>
          {items.map(([label, href, Icon]) => {

            const active =
              href === "/admin"
                ? pathname === href
                : pathname.startsWith(href);

            return (
              <Link
                key={label}
                href={href}
                className={`${styles.navItem} ${
                  active ? styles.activeNav : ""
                }`}
                onClick={() => setOpen(false)}
              >
                <Icon size={18} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className={styles.bottom}>
          <button
            type="button"
            className={styles.navItem}
            onClick={handleSignOut}
            disabled={signingOut}
            style={{
              width: "100%",
              background: "transparent",
              border: 0,
              cursor: signingOut ? "wait" : "pointer",
              textAlign: "left",
            }}
          >
            <LogOut size={18} />
            <span>
              {signingOut ? "Signing out..." : "Sign out"}
            </span>
          </button>
        </div>

      </aside>

      <main className={styles.main}>

        <header className={styles.header}>

          <button
            className={styles.mobileMenu}
            aria-label="Open menu"
            onClick={() => setOpen(true)}
          >
            <Menu size={21} />
          </button>

          <div>
            <strong>{role} Dashboard</strong>
            <span>Al Shaimaa Quran Academy</span>
          </div>

          <div className={styles.user}>
            <div className={styles.avatar}>A</div>

            <div>
              <strong>Admin</strong>
              <small>Administrator</small>
            </div>
          </div>

        </header>

        <section className={styles.content}>
          {children}
        </section>

      </main>

    </div>
  );
}
