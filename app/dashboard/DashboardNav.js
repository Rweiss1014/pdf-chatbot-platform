"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

export default function DashboardNav({ email }) {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <nav className="dashboard-nav">
      <Link href="/dashboard" className="nav-brand">SmartDoc</Link>
      <div className="nav-links">
        <Link href="/dashboard">My Guides</Link>
        <Link href="/dashboard/settings">Settings</Link>
        <span className="nav-email">{email}</span>
        <button onClick={handleLogout} className="btn btn-small btn-secondary">
          Log Out
        </button>
      </div>
    </nav>
  );
}
