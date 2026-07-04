import ComingSoonPage from "../components/ComingSoonPage";

export default function CoverLetterPage() {
  return (
    <ComingSoonPage
      sprint="3"
      kicker="Writer agent"
      title="Cover"
      titleAccent="letter"
      description="Generate a tailored letter from your gap analysis — edit, save, and attach it to the role in your pipeline."
      headline="Cover letter studio is coming"
      body="The Writer agent will turn Analyzer output + your profile into a draft you can refine. No generic AI slop — grounded in your actual CV and the listing."
      iconVariant="letter"
      features={[
        "Company-aware tone & structure",
        "Built from Analyzer insights",
        "Edit before you save",
        "Linked to each application",
      ]}
    />
  );
}
