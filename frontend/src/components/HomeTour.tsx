import { useCallback, useEffect, useLayoutEffect, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";

import GuideFigure from "./GuideFigure";

export const HOME_TOUR_PENDING_KEY = "internroute_home_tour_pending";
export const HOME_TOUR_DONE_KEY = "internroute_home_tour_done";
export const HOME_TOUR_START_EVENT = "internroute:start-home-tour";
export const HOME_TOUR_ACTIVE_EVENT = "internroute:home-tour-active";

interface TourStep {
  target: string | null;
  title: string;
  body: string;
}

const STEPS: TourStep[] = [
  {
    target: null,
    title: "Welcome to your desk",
    body: "Quick tour of InternRoute — top bar first, then your three desk cards. Tap Next and I’ll point.",
  },
  {
    target: "[data-tour='nav-home']",
    title: "Home",
    body: "Your hub. Live counts and the Board → Locker → Pipeline flow live here.",
  },
  {
    target: "[data-tour='nav-board']",
    title: "Board (top bar)",
    body: "Jump here anytime to pin and manage internship roles.",
  },
  {
    target: "[data-tour='nav-cvs']",
    title: "CVs (top bar)",
    body: "Your locker — upload, view, and swap PDF versions.",
  },
  {
    target: "[data-tour='nav-pipeline']",
    title: "Pipeline (top bar)",
    body: "Applications desk: match job + CV, notes, and written answers.",
  },
  {
    target: "[data-tour='nav-ai']",
    title: "AI tools (soon)",
    body: "Analyze, Interview, and Letters unlock in Sprint 3 — tags show what’s coming.",
  },
  {
    target: "[data-tour='nav-profile']",
    title: "Profile",
    body: "University, major, and target sectors — later used by AI helpers.",
  },
  {
    target: "[data-tour='desk-board']",
    title: "Desk · Board card",
    body: "Pin every role you like. Titles, companies, status — your living shortlist.",
  },
  {
    target: "[data-tour='desk-locker']",
    title: "Desk · Locker card",
    body: "Keep CV PDFs here. Different versions for different companies when you apply.",
  },
  {
    target: "[data-tour='desk-pipeline']",
    title: "Desk · Pipeline card",
    body: "Link a job + CV, add notes and written answers. This is where applications live.",
  },
];

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function placeTourChrome(spotlight: SpotlightRect | null) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const cardW = Math.min(320, vw - 24);
  const cardH = Math.min(190, vh * 0.32);
  const guideW = 80;
  const guideH = 100;
  const margin = 10;
  const gap = 10;

  if (!spotlight) {
    return {
      card: undefined as CSSProperties | undefined,
      guide: undefined as CSSProperties | undefined,
      guideFlip: false,
      cardClass: "home-tour-card--center",
    };
  }

  const spaceBelow = vh - (spotlight.top + spotlight.height);
  const spaceAbove = spotlight.top;
  const placeBelow = spaceBelow >= cardH + 20 || spaceBelow >= spaceAbove;

  let cardTop = placeBelow
    ? spotlight.top + spotlight.height + gap
    : spotlight.top - cardH - gap;
  cardTop = clamp(cardTop, margin, vh - cardH - margin);

  let cardLeft = spotlight.left + spotlight.width / 2 - cardW / 2;
  cardLeft = clamp(cardLeft, margin, vw - cardW - margin);

  const spaceRight = vw - (spotlight.left + spotlight.width);
  const spaceLeft = spotlight.left;
  const placeGuideRight = spaceRight >= guideW + 16 || spaceRight >= spaceLeft;

  let guideLeft = placeGuideRight
    ? spotlight.left + spotlight.width + gap
    : spotlight.left - guideW - gap;
  guideLeft = clamp(guideLeft, margin, vw - guideW - margin);

  let guideTop = spotlight.top + spotlight.height / 2 - guideH / 2;
  guideTop = clamp(guideTop, margin, vh - guideH - margin);

  const overlapsCard =
    guideLeft < cardLeft + cardW &&
    guideLeft + guideW > cardLeft &&
    guideTop < cardTop + cardH &&
    guideTop + guideH > cardTop;

  if (overlapsCard) {
    const leftOfCard = cardLeft - guideW - gap;
    const rightOfCard = cardLeft + cardW + gap;
    if (placeGuideRight && rightOfCard + guideW <= vw - margin) {
      guideLeft = rightOfCard;
    } else if (leftOfCard >= margin) {
      guideLeft = leftOfCard;
    } else {
      guideTop = clamp(cardTop - guideH - gap, margin, vh - guideH - margin);
    }
  }

  return {
    card: {
      top: cardTop,
      left: cardLeft,
      width: cardW,
      maxHeight: Math.min(cardH + 40, vh - margin * 2),
    },
    guide: { top: guideTop, left: guideLeft },
    guideFlip: guideLeft + guideW / 2 > spotlight.left + spotlight.width / 2,
    cardClass: "home-tour-card--anchored",
  };
}

function TourGuide({ style, flip }: { style?: CSSProperties; flip?: boolean }) {
  return (
    <div
      className={`home-tour-guide${style ? " home-tour-guide--anchored" : " home-tour-guide--center"}${flip ? " home-tour-guide--flip" : ""}`}
      style={style}
      aria-hidden="true"
    >
      <GuideFigure className="home-tour-guide-svg" />
    </div>
  );
}

interface HomeTourProps {
  active: boolean;
  onFinish: () => void;
}

export default function HomeTour({ active, onFinish }: HomeTourProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null);

  useEffect(() => {
    if (active) {
      setStepIndex(0);
    }
  }, [active]);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent(HOME_TOUR_ACTIVE_EVENT, { detail: { active } }),
    );
    return () => {
      window.dispatchEvent(
        new CustomEvent(HOME_TOUR_ACTIVE_EVENT, { detail: { active: false } }),
      );
    };
  }, [active]);

  const step = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;

  const measure = useCallback(() => {
    if (!step?.target) {
      setSpotlight(null);
      return;
    }
    const node = document.querySelector(step.target);
    if (!(node instanceof HTMLElement)) {
      setSpotlight(null);
      return;
    }
    const rect = node.getBoundingClientRect();
    const pad = 8;
    setSpotlight({
      top: rect.top - pad,
      left: rect.left - pad,
      width: rect.width + pad * 2,
      height: rect.height + pad * 2,
    });
    node.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
  }, [step]);

  useLayoutEffect(() => {
    if (!active) {
      return;
    }
    measure();
  }, [active, stepIndex, measure]);

  useEffect(() => {
    if (!active) {
      return;
    }
    const onResize = () => measure();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
  }, [active, measure]);

  useEffect(() => {
    if (!active) {
      return;
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [active]);

  if (!active || !step) {
    return null;
  }

  const chrome = placeTourChrome(spotlight);

  return createPortal(
    <div className="home-tour" role="dialog" aria-modal="true" aria-label="Home desk tour">
      <div className="home-tour-dim" />
      {spotlight ? (
        <div
          className="home-tour-spotlight"
          style={{
            top: spotlight.top,
            left: spotlight.left,
            width: spotlight.width,
            height: spotlight.height,
          }}
        />
      ) : null}

      <TourGuide style={chrome.guide} flip={chrome.guideFlip} />

      <div className={`home-tour-card ${chrome.cardClass}`} style={chrome.card}>
        <p className="home-tour-step">
          {stepIndex + 1} / {STEPS.length}
        </p>
        <h2>{step.title}</h2>
        <p>{step.body}</p>
        <div className="home-tour-actions">
          <button type="button" className="home-tour-skip" onClick={onFinish}>
            Skip
          </button>
          <button
            type="button"
            className="home-tour-next"
            onClick={() => {
              if (isLast) {
                onFinish();
                return;
              }
              setStepIndex((current) => current + 1);
            }}
          >
            {isLast ? "Got it" : "Next"}
            {!isLast ? <span aria-hidden="true"> →</span> : null}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function shouldStartHomeTour(): boolean {
  return (
    localStorage.getItem(HOME_TOUR_PENDING_KEY) === "1" &&
    localStorage.getItem(HOME_TOUR_DONE_KEY) !== "1"
  );
}

export function markHomeTourPending(): void {
  localStorage.setItem(HOME_TOUR_PENDING_KEY, "1");
  localStorage.removeItem(HOME_TOUR_DONE_KEY);
}

export function markHomeTourDone(): void {
  localStorage.setItem(HOME_TOUR_DONE_KEY, "1");
  localStorage.removeItem(HOME_TOUR_PENDING_KEY);
}
