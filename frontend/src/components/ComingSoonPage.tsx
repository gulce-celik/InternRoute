import AnimatedCard from "./AnimatedCard";

interface ComingSoonPageProps {
  sprint: "2" | "3";
  kicker: string;
  title: string;
  titleAccent: string;
  description: string;
  headline: string;
  body: string;
  features: string[];
  iconVariant?: "doc" | "chat" | "scan" | "letter";
}

export default function ComingSoonPage({
  sprint,
  kicker,
  title,
  titleAccent,
  description,
  headline,
  body,
  features,
  iconVariant = "doc",
}: ComingSoonPageProps) {
  return (
    <section className="page-section">
      <div className="page-hero page-hero--animated">
        <p className="page-kicker">
          {kicker}
          <span className="sprint-badge">Sprint {sprint}</span>
        </p>
        <h1>
          {title} <em>{titleAccent}</em>
        </h1>
        <p className="page-description">{description}</p>
      </div>

      <AnimatedCard>
        <div className="coming-soon-card">
          <div
            className={`coming-soon-icon coming-soon-icon--${iconVariant}`}
            aria-hidden="true"
          />
          <strong>{headline}</strong>
          <p className="muted">{body}</p>
          <ul className="feature-preview-list">
            {features.map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>
          <p className="coming-soon-footnote">
            Not built yet — this screen shows where the feature will live. Agents and APIs ship in
            Sprint {sprint}.
          </p>
        </div>
      </AnimatedCard>
    </section>
  );
}
