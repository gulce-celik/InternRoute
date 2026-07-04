export default function SceneBackdrop() {
  return (
    <div className="scene-backdrop" aria-hidden="true">
      <svg className="scene-svg" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern id="scene-grid" width="28" height="28" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.1" fill="rgba(20, 17, 15, 0.07)" />
          </pattern>
        </defs>

        <rect width="100%" height="100%" fill="url(#scene-grid)" />

        {/* Career route — InternRoute metaphor */}
        <path
          className="scene-route scene-route--main"
          d="M -20 720 C 180 640, 260 520, 420 480 S 760 380, 920 340 S 1180 220, 1480 160"
          fill="none"
          stroke="rgba(200, 75, 49, 0.22)"
          strokeWidth="2"
          strokeDasharray="10 14"
        />
        <path
          className="scene-route scene-route--ghost"
          d="M 80 180 C 240 140, 360 260, 520 240 S 820 120, 980 200 S 1240 280, 1420 420"
          fill="none"
          stroke="rgba(47, 93, 74, 0.16)"
          strokeWidth="1.5"
          strokeDasharray="6 12"
        />

        {/* Route checkpoints (application stages) */}
        <g className="scene-node scene-node--a">
          <circle cx="420" cy="480" r="7" fill="#fffdf9" stroke="#14110f" strokeWidth="2" />
          <circle cx="420" cy="480" r="3" fill="#c84b31" />
        </g>
        <g className="scene-node scene-node--b">
          <circle cx="920" cy="340" r="7" fill="#fffdf9" stroke="#14110f" strokeWidth="2" />
          <circle cx="920" cy="340" r="3" fill="#e8b84a" />
        </g>
        <g className="scene-node scene-node--c">
          <circle cx="520" cy="240" r="6" fill="#fffdf9" stroke="#14110f" strokeWidth="2" />
          <circle cx="520" cy="240" r="2.5" fill="#2f5d4a" />
        </g>
      </svg>

      {/* Floating job listing cards (wireframe, not emoji) */}
      <div className="scene-listing scene-listing--one">
        <span className="scene-listing-pin" />
        <span className="scene-listing-line scene-listing-line--title" />
        <span className="scene-listing-line" />
        <span className="scene-listing-line scene-listing-line--short" />
      </div>

      <div className="scene-listing scene-listing--two">
        <span className="scene-listing-pin" />
        <span className="scene-listing-line scene-listing-line--title" />
        <span className="scene-listing-line" />
        <span className="scene-listing-line scene-listing-line--short" />
      </div>

      {/* CV sheet silhouette */}
      <div className="scene-doc scene-doc--one">
        <span className="scene-doc-fold" />
        <span className="scene-doc-line scene-doc-line--wide" />
        <span className="scene-doc-line" />
        <span className="scene-doc-line" />
        <span className="scene-doc-line scene-doc-line--narrow" />
      </div>
    </div>
  );
}
