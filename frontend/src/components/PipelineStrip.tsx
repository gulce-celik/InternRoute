const STAGES = [
  { key: "saved", label: "Saved", marker: "saved" },
  { key: "applied", label: "Applied", marker: "applied" },
  { key: "interview", label: "Interview", marker: "interview" },
  { key: "offer", label: "Offer", marker: "offer" },
] as const;

interface PipelineStripProps {
  activeStage?: (typeof STAGES)[number]["key"];
}

function StageMarker({ marker }: { marker: string }) {
  return <span className={`pipeline-marker pipeline-marker--${marker}`} aria-hidden="true" />;
}

export default function PipelineStrip({ activeStage = "saved" }: PipelineStripProps) {
  const activeIndex = STAGES.findIndex((stage) => stage.key === activeStage);

  return (
    <div className="pipeline-strip" aria-label="Application pipeline">
      <div className="pipeline-track">
        <span
          className="pipeline-progress"
          style={{ width: `${((activeIndex + 1) / STAGES.length) * 100}%` }}
        />
      </div>
      <ol className="pipeline-stages">
        {STAGES.map((stage, index) => {
          const state =
            index < activeIndex ? "done" : index === activeIndex ? "active" : "upcoming";

          return (
            <li key={stage.key} className={`pipeline-stage pipeline-stage--${state}`}>
              <span className="pipeline-dot">
                <StageMarker marker={stage.marker} />
              </span>
              <span className="pipeline-label">{stage.label}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
