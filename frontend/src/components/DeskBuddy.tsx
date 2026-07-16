import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import GuideFigure from "./GuideFigure";
import { guideForPath } from "./deskBuddyGuides";
import { HOME_TOUR_ACTIVE_EVENT, HOME_TOUR_START_EVENT } from "./HomeTour";

type BuddyPanel = "menu" | "tips" | "report";

const ISSUE_REPO_URL = "https://github.com/gulce-celik/InternRoute/issues/new";

function buildIssueUrl(details: string) {
  const body = [
    "### What happened?",
    details.trim() || "(describe the bug or idea)",
    "",
    "### Where?",
    `- Page: ${window.location.pathname}`,
    `- Browser: ${navigator.userAgent}`,
    "",
    "### Expected vs actual",
    "(optional)",
  ].join("\n");

  const params = new URLSearchParams({
    title: details.trim().slice(0, 72) || "Desk buddy report",
    body,
  });
  return `${ISSUE_REPO_URL}?${params.toString()}`;
}

export default function DeskBuddy() {
  const location = useLocation();
  const navigate = useNavigate();
  const guide = guideForPath(location.pathname);

  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState<BuddyPanel>("menu");
  const [openTip, setOpenTip] = useState<number | null>(0);
  const [reportText, setReportText] = useState("");
  const [tourActive, setTourActive] = useState(false);

  useEffect(() => {
    setOpen(false);
    setPanel("menu");
    setOpenTip(0);
  }, [location.pathname]);

  useEffect(() => {
    const onTourActive = (event: Event) => {
      const detail = (event as CustomEvent<{ active: boolean }>).detail;
      setTourActive(Boolean(detail?.active));
      if (detail?.active) {
        setOpen(false);
      }
    };
    window.addEventListener(HOME_TOUR_ACTIVE_EVENT, onTourActive);
    return () => window.removeEventListener(HOME_TOUR_ACTIVE_EVENT, onTourActive);
  }, []);

  if (tourActive) {
    return null;
  }

  return (
    <div className="desk-buddy">
      {open ? (
        <div className="desk-buddy-panel" role="dialog" aria-label={`${guide.pageLabel} desk buddy`}>
          <div className="desk-buddy-panel-head">
            <p className="page-kicker">
              Desk buddy · {guide.pageLabel}
            </p>
            <button
              type="button"
              className="desk-buddy-close"
              onClick={() => {
                setOpen(false);
                setPanel("menu");
              }}
              aria-label="Close help"
            >
              ×
            </button>
          </div>

          {panel === "menu" ? (
            <>
              <h2>{guide.title}</h2>
              <p className="desk-buddy-copy">{guide.copy}</p>

              {guide.showHomeTour ? (
                <button
                  type="button"
                  className="desk-buddy-action"
                  onClick={() => {
                    setOpen(false);
                    setPanel("menu");
                    if (location.pathname !== "/") {
                      navigate("/");
                    }
                    window.dispatchEvent(new Event(HOME_TOUR_START_EVENT));
                  }}
                >
                  Replay desk tour
                  <span aria-hidden="true"> →</span>
                </button>
              ) : null}

              <button
                type="button"
                className={`desk-buddy-action${guide.showHomeTour ? " desk-buddy-action--ghost" : ""}`}
                onClick={() => setPanel("tips")}
              >
                {guide.tipsTitle}
                <span aria-hidden="true"> →</span>
              </button>

              {guide.quickLinks?.length ? (
                <div className="desk-buddy-links">
                  {guide.quickLinks.map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      className="desk-buddy-link"
                      onClick={() => setOpen(false)}
                    >
                      {link.label}
                      <span aria-hidden="true"> →</span>
                    </Link>
                  ))}
                </div>
              ) : null}

              <button
                type="button"
                className="desk-buddy-action desk-buddy-action--ghost"
                onClick={() => setPanel("report")}
              >
                Report an issue
                <span aria-hidden="true"> →</span>
              </button>
            </>
          ) : null}

          {panel === "tips" ? (
            <div className="desk-buddy-faq-layout">
              <div className="desk-buddy-faq-main">
                <button type="button" className="desk-buddy-back" onClick={() => setPanel("menu")}>
                  ← Back
                </button>
                <h2>{guide.tipsTitle}</h2>
                <ul className="desk-buddy-faq">
                  {guide.tips.map((item, index) => {
                    const expanded = openTip === index;
                    return (
                      <li key={item.q}>
                        <button
                          type="button"
                          className={`desk-buddy-faq-q${expanded ? " desk-buddy-faq-q--open" : ""}`}
                          onClick={() => setOpenTip(expanded ? null : index)}
                          aria-expanded={expanded}
                        >
                          {item.q}
                        </button>
                        {expanded ? <p className="desk-buddy-faq-a">{item.a}</p> : null}
                      </li>
                    );
                  })}
                </ul>
              </div>
              <div className="desk-buddy-faq-side" aria-hidden="true">
                <GuideFigure className="desk-buddy-faq-guide" />
              </div>
            </div>
          ) : null}

          {panel === "report" ? (
            <div className="desk-buddy-report">
              <button type="button" className="desk-buddy-back" onClick={() => setPanel("menu")}>
                ← Back
              </button>
              <h2>Report an issue</h2>
              <p className="desk-buddy-copy">
                Bug, typo, or idea — a short note is enough. We’ll open GitHub with this page filled in.
              </p>
              <label className="desk-buddy-report-label" htmlFor="desk-buddy-report-text">
                What happened?
              </label>
              <textarea
                id="desk-buddy-report-text"
                className="desk-buddy-report-input"
                rows={4}
                value={reportText}
                onChange={(event) => setReportText(event.target.value)}
                placeholder={`e.g. Something on ${guide.pageLabel} feels off…`}
              />
              <button
                type="button"
                className="desk-buddy-action"
                onClick={() => {
                  window.open(buildIssueUrl(reportText), "_blank", "noopener,noreferrer");
                }}
              >
                Open GitHub issue
                <span aria-hidden="true"> →</span>
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      <button
        type="button"
        className={`desk-buddy-fab${open ? " desk-buddy-fab--open" : ""}`}
        onClick={() => {
          setOpen((value) => !value);
          setPanel("menu");
        }}
        aria-label={open ? "Close desk buddy" : guide.fabHint}
      >
        <GuideFigure className="desk-buddy-fab-svg" />
        <span className="desk-buddy-fab-label">Help</span>
      </button>
    </div>
  );
}
