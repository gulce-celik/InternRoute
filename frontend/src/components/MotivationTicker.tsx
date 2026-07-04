const QUOTES = [
  "Your next internship starts with one pinned role.",
  "Tailor the CV. Track the stage. Own the interview.",
  "No more lost applications in random notes.",
  "Build your pipeline before deadline week hits.",
];

export default function MotivationTicker() {
  const line = QUOTES.join("   •   ");

  return (
    <div className="motivation-ticker" aria-hidden="true">
      <div className="motivation-ticker-track">
        <span>{line}</span>
        <span>{line}</span>
      </div>
    </div>
  );
}
