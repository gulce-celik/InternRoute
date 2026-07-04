import ComingSoonPage from "../components/ComingSoonPage";

export default function InterviewPage() {
  return (
    <ComingSoonPage
      sprint="3"
      kicker="HR mock agent"
      title="Mock"
      titleAccent="interview"
      description="Practice role-specific questions before the real call. Your answers feed back into memory for smarter prep next time."
      headline="Mock interview chat arrives in Sprint 3"
      body="The HR agent will run a conversational mock session based on the company, role, and your CV — then save highlights to your internship memory."
      iconVariant="chat"
      features={[
        "Job-specific question flow",
        "Follow-up prompts like a real interviewer",
        "Session history per role",
        "Answers stored for RAG context",
      ]}
    />
  );
}
