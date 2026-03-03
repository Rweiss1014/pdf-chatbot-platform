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
  const hasGuides = guides && guides.length > 0;

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

      {/* Welcome card — shows for all users */}
      <div className="welcome-card">
        <h2>How it works</h2>
        <div className="welcome-steps">
          <div className="welcome-step">
            <div className="welcome-step-number">1</div>
            <div>
              <strong>Upload a PDF</strong>
              <p>Any training doc, handbook, or guide. AI reads every page.</p>
            </div>
          </div>
          <div className="welcome-step">
            <div className="welcome-step-number">2</div>
            <div>
              <strong>Customize</strong>
              <p>Set your brand colors, enable quizzes, and tweak the welcome message.</p>
            </div>
          </div>
          <div className="welcome-step">
            <div className="welcome-step-number">3</div>
            <div>
              <strong>Share</strong>
              <p>Send the link or embed on any site. Track learner engagement in Analytics.</p>
            </div>
          </div>
        </div>
      </div>

      {hasGuides ? (
        <div className="guides-grid">
          {guides.map((guide) => (
            <GuideCard key={guide.id} guide={guide} />
          ))}
        </div>
      ) : (
        <div className="empty-state-card">
          <div className="empty-state-icon">+</div>
          <h2>Create your first chatbot</h2>
          <p>Upload a PDF and SmartDoc turns it into an interactive AI assistant your learners can chat with and quiz themselves on.</p>
          {hasApiKey ? (
            <Link href="/dashboard/upload" className="btn btn-primary">
              Upload Your First PDF
            </Link>
          ) : (
            <Link href="/dashboard/settings" className="btn btn-primary">
              Set Up API Key to Get Started
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
