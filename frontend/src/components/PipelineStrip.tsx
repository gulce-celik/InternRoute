const STAGES = [
  { key: "saved", label: "Saved", marker: "saved" },
  { key: "applied", label: "Applied", marker: "applied" },
  { key: "interview", label: "Interview", marker: "interview" },
  { key: "offer", label: "Offer", marker: "offer" },
] as const;

interface PipelineStripProps {
  /** Null / undefined with noProgress: show empty track (e.g. rejected applications). */
  activeStage?: (typeof STAGES)[number]["key"] | null;
}

function StageMarker({ marker }: { marker: string }) {
  return <span className={`pipeline-marker pipeline-marker--${marker}`} aria-hidden="true" />;
}

export default function PipelineStrip({ activeStage = "saved" }: PipelineStripProps) {
  const hasProgress = activeStage != null;
  const activeIndex = hasProgress
    ? STAGES.findIndex((stage) => stage.key === activeStage)
    : -1;

  return (
    <div
      className={`pipeline-strip${hasProgress ? "" : " pipeline-strip--empty"}`}
      aria-label="Application pipeline"
    >
      <div className="pipeline-track">
        <span
          className="pipeline-progress"
          style={{
            width: hasProgress ? `${((activeIndex + 1) / STAGES.length) * 100}%` : "0%",
          }}
        />
      </div>
      <ol className="pipeline-stages">
        {STAGES.map((stage, index) => {
          const state = !hasProgress
            ? "upcoming"
            : index < activeIndex
              ? "done"
              : index === activeIndex
                ? "active"
                : "upcoming";

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
