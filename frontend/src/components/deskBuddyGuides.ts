export interface DeskBuddyTip {
  q: string;
  a: string;
}

export interface DeskBuddyQuickLink {
  label: string;
  to: string;
}

export interface DeskBuddyGuide {
  path: string;
  pageLabel: string;
  title: string;
  copy: string;
  fabHint: string;
  tipsTitle: string;
  tips: DeskBuddyTip[];
  quickLinks?: DeskBuddyQuickLink[];
  showHomeTour?: boolean;
}

export const DESK_BUDDY_GUIDES: DeskBuddyGuide[] = [
  {
    path: "/",
    pageLabel: "Home",
    title: "Your desk hub",
    copy: "Board → Locker → Pipeline. Live counts stay open all season — replay the tour anytime.",
    fabHint: "Home help",
    tipsTitle: "Home tips",
    showHomeTour: true,
    tips: [
      {
        q: "Where do I start?",
        a: "Pin a role on the Board, upload a CV to the Locker, then link them in Pipeline.",
      },
      {
        q: "What do the three cards mean?",
        a: "Board = shortlist, Locker = CV PDFs, Pipeline = applications with notes and Q&A.",
      },
      {
        q: "Do cards turn green when I’m done?",
        a: "No. Counts just grow as you hunt — nothing “finishes” after one pin.",
      },
      {
        q: "When do Analyze / Interview / Letters work?",
        a: "Sprint 3. Until then they’re marked S3 in the top bar.",
      },
    ],
    quickLinks: [
      { label: "Open Board", to: "/jobs" },
      { label: "Open Locker", to: "/cvs" },
      { label: "Open Pipeline", to: "/applications" },
    ],
  },
  {
    path: "/jobs",
    pageLabel: "Board",
    title: "Pin roles here",
    copy: "Every internship you like lives on this board — title, company, status, and notes.",
    fabHint: "Board help",
    tipsTitle: "Board tips",
    tips: [
      {
        q: "How do I add a role?",
        a: "Fill the form (title + company at minimum) and save. Status defaults to Applied or Saved for later.",
      },
      {
        q: "What do the statuses mean?",
        a: "Saved for later, Applied, Interview, Offer, Rejected — update them as the process moves.",
      },
      {
        q: "Can I delete a pinned role?",
        a: "Yes. Removing a job clears it from the board; applications linked to it may need a new job later.",
      },
      {
        q: "Where do I apply with a CV?",
        a: "Pin here first, then open Pipeline and link this job to a CV from your locker.",
      },
    ],
    quickLinks: [
      { label: "Go to Pipeline", to: "/applications" },
      { label: "Go to CVs", to: "/cvs" },
    ],
  },
  {
    path: "/cvs",
    pageLabel: "CVs",
    title: "Your locker",
    copy: "Upload PDF versions — general, company-specific, or tailored for one sector.",
    fabHint: "Locker help",
    tipsTitle: "Locker tips",
    tips: [
      {
        q: "What files work?",
        a: "PDF only for now. Upload succeeds, then text is extracted into memory for later AI tools.",
      },
      {
        q: "Why keep more than one CV?",
        a: "Different companies care about different skills. Pick the right file when you create an application.",
      },
      {
        q: "What is “memory”?",
        a: "Parsed CV text stored for Sprint 3 agents (Analyze, Interview, Letters).",
      },
      {
        q: "What if I delete a CV?",
        a: "The file leaves the locker. Applications that used it keep their record; you can attach another CV.",
      },
    ],
    quickLinks: [
      { label: "Link in Pipeline", to: "/applications" },
      { label: "Update Profile", to: "/profile" },
    ],
  },
  {
    path: "/applications",
    pageLabel: "Pipeline",
    title: "Application desk",
    copy: "Match a Board job + Locker CV, track stage, and stash notes or written answers.",
    fabHint: "Pipeline help",
    tipsTitle: "Pipeline tips",
    tips: [
      {
        q: "How do I create an application?",
        a: "Pick a job and a CV, add optional notes, then save. You’ll see it in the list with a stage strip.",
      },
      {
        q: "Can I change the CV later?",
        a: "Yes. Open the application, pick another CV from your locker, and save.",
      },
      {
        q: "What are Q&A items?",
        a: "Screening questions and your written answers — keep them with the application so they’re easy to reuse.",
      },
      {
        q: "Job or CV missing in the dropdowns?",
        a: "Pin a role on the Board and upload at least one PDF to the Locker first.",
      },
    ],
    quickLinks: [
      { label: "Pin a role", to: "/jobs" },
      { label: "Upload a CV", to: "/cvs" },
    ],
  },
  {
    path: "/profile",
    pageLabel: "Profile",
    title: "Your profile",
    copy: "Name, school, year, major, and target sectors. Keep it short and accurate.",
    fabHint: "Profile help",
    tipsTitle: "Profile tips",
    tips: [
      {
        q: "Why fill this in?",
        a: "Sprint 3 tools use it so tips and letters match your path.",
      },
      {
        q: "What are target sectors?",
        a: "Areas you’re hunting — tap chips or type your own list.",
      },
    ],
    quickLinks: [
      { label: "Back to Home", to: "/" },
      { label: "Open Board", to: "/jobs" },
    ],
  },
  {
    path: "/analyze",
    pageLabel: "Analyze",
    title: "Gap scan (soon)",
    copy: "Sprint 3: compare a pinned role to your CV memory and see strengths, gaps, and quick wins.",
    fabHint: "Analyze help",
    tipsTitle: "Get ready",
    tips: [
      {
        q: "What should I do before Sprint 3?",
        a: "Pin roles, upload CVs, fill Profile, and track applications — richer desk data means better analysis.",
      },
      {
        q: "What will Analyze use?",
        a: "Job description + locker CV text + your profile sectors.",
      },
      {
        q: "Can I use it now?",
        a: "Not yet — the page is a roadmap preview. Keep building Board, Locker, and Pipeline.",
      },
    ],
    quickLinks: [
      { label: "Build the Board", to: "/jobs" },
      { label: "Fill the Locker", to: "/cvs" },
    ],
  },
  {
    path: "/interview",
    pageLabel: "Interview",
    title: "Mock chat (soon)",
    copy: "Sprint 3: practice role-specific questions in a mock HR conversation grounded in your CV.",
    fabHint: "Interview help",
    tipsTitle: "Get ready",
    tips: [
      {
        q: "How do I prep today?",
        a: "Save written screening answers in Pipeline Q&A and keep your CV versions up to date.",
      },
      {
        q: "Will mocks be per company?",
        a: "Yes — tied to a pinned role so questions match the listing and your background.",
      },
      {
        q: "Is this live now?",
        a: "Coming in Sprint 3. Until then use Pipeline notes to rehearse answers yourself.",
      },
    ],
    quickLinks: [
      { label: "Pipeline Q&A", to: "/applications" },
      { label: "Update Profile", to: "/profile" },
    ],
  },
  {
    path: "/cover-letter",
    pageLabel: "Letters",
    title: "Letter studio (soon)",
    copy: "Sprint 3: draft a cover letter from Analyzer insights + profile, then edit and attach it.",
    fabHint: "Letters help",
    tipsTitle: "Get ready",
    tips: [
      {
        q: "What feeds a good letter later?",
        a: "Clear job descriptions on the Board, a strong CV in the Locker, and a filled Profile.",
      },
      {
        q: "Will letters be generic AI?",
        a: "No — drafts will be grounded in your CV memory and the specific role.",
      },
      {
        q: "Available now?",
        a: "Not yet. Focus on pinning roles and tracking applications until Sprint 3 lands.",
      },
    ],
    quickLinks: [
      { label: "Pin roles", to: "/jobs" },
      { label: "Open Pipeline", to: "/applications" },
    ],
  },
];

const FALLBACK: DeskBuddyGuide = {
  path: "*",
  pageLabel: "InternRoute",
  title: "Desk buddy",
  copy: "I’m here on every page — tips, shortcuts, and a way to report issues.",
  fabHint: "Help",
  tipsTitle: "Tips",
  tips: [
    {
      q: "Where is Home?",
      a: "Top bar → Home. That’s your Board / Locker / Pipeline hub.",
    },
  ],
};

export function guideForPath(pathname: string): DeskBuddyGuide {
  const exact = DESK_BUDDY_GUIDES.find((guide) => guide.path === pathname);
  if (exact) {
    return exact;
  }
  return FALLBACK;
}
