import ComingSoonPage from "../components/ComingSoonPage";

export default function AnalyzePage() {
  return (
    <ComingSoonPage
      sprint="3"
      kicker="Analyzer agent"
      title="CV vs role"
      titleAccent="gap scan"
      description="Compare your CV to a pinned role and see strong fits, missing keywords, and what to stress in your application."
      headline="AI gap analysis is on the roadmap"
      body="The Analyzer agent will read your job listing + CV memory and return a clear strengths / gaps report — tailored to your profile and target sectors."
      iconVariant="scan"
      features={[
        "Job description vs CV skill match",
        "Missing keywords & quick wins",
        "Uses your Profile + RAG memory",
        "One click from any pinned role",
      ]}
    />
  );
}
