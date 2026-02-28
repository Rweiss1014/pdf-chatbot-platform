import { createClient } from "@/lib/supabase-server";
import Link from "next/link";
import GuideCard from "./GuideCard";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: guides } = await supabase
    .from("guides")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // Check if user has API key set
  const { data: profile } = await supabase
    .from("profiles")
    .select("openai_api_key_encrypted")
    .eq("id", user.id)
    .single();

  const hasApiKey = !!profile?.openai_api_key_encrypted;

  return (
    <div className="dashboard-content">
      <div className="dashboard-header">
        <h1>My Guides</h1>
        {hasApiKey ? (
          <Link href="/dashboard/upload" className="btn btn-primary">
            + Upload New PDF
          </Link>
        ) : (
          <Link href="/dashboard/settings" className="btn btn-warning">
            Add API Key First
          </Link>
        )}
      </div>

      {!hasApiKey && (
        <div className="alert alert-warning">
          You need to add your OpenAI API key before uploading PDFs.{" "}
          <Link href="/dashboard/settings">Go to Settings</Link>
        </div>
      )}

      {guides && guides.length > 0 ? (
        <div className="guides-grid">
          {guides.map((guide) => (
            <GuideCard key={guide.id} guide={guide} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h2>No guides yet</h2>
          <p>Upload a PDF to create your first AI chatbot guide.</p>
        </div>
      )}
    </div>
  );
}
