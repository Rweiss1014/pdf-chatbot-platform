import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import DashboardNav from "./DashboardNav";

export default async function DashboardLayout({ children }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="dashboard-layout">
      <DashboardNav email={user.email} />
      <main className="dashboard-main">{children}</main>
    </div>
  );
}
