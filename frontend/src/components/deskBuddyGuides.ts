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
        a: "All three are live. Pin a role + CV first, then open Analyze, Interview, or Letters from the top bar.",
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
        a: "Parsed CV text used by Analyze, Interview, and Letters so answers stay grounded in your file.",
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
        q: "Can I practice for a role?",
        a: "Yes. Open Interview, pick the same job + CV (or come from Pipeline), and run a short mock HR chat.",
      },
      {
        q: "Job or CV missing in the dropdowns?",
        a: "Pin a role on the Board and upload at least one PDF to the Locker first.",
      },
    ],
    quickLinks: [
      { label: "Pin a role", to: "/jobs" },
      { label: "Upload a CV", to: "/cvs" },
      { label: "Practice interview", to: "/interview" },
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
        a: "Analyze, Interview, and Letters use it so tips and questions match your path.",
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
    title: "Gap scan",
    copy: "Compare a pinned role to a locker CV. Strengths, gaps, and keywords come from job text + CV memory.",
    fabHint: "Analyze help",
    tipsTitle: "How to use it",
    tips: [
      {
        q: "What do I pick?",
        a: "A Board role + CV version, or a Pipeline match that already links both.",
      },
      {
        q: "Why is the report thin?",
        a: "Short or empty CV memory limits the scan. Upload a fuller PDF, then reingest if needed.",
      },
      {
        q: "Does it save the report?",
        a: "Not yet — results stay on this page for the session. Copy what you need into Pipeline notes.",
      },
    ],
    quickLinks: [
      { label: "Open Board", to: "/jobs" },
      { label: "Open Locker", to: "/cvs" },
      { label: "Open Pipeline", to: "/applications" },
    ],
  },
  {
    path: "/interview",
    pageLabel: "Interview",
    title: "Mock HR practice",
    copy: "Pick a pinned role + CV, answer a short chat, get coaching after each turn, then a wrap-up summary.",
    fabHint: "Interview help",
    tipsTitle: "How to use it",
    tips: [
      {
        q: "How do I start?",
        a: "Choose a Board role and a locker CV, then hit Start practice. Prefer a Pipeline match so both are linked.",
      },
      {
        q: "How long is a session?",
        a: "About 5–7 questions — behavioral plus light role-fit. Enter sends; Shift+Enter adds a new line.",
      },
      {
        q: "Where does feedback go?",
        a: "Under your answer and in the Coaching rail. When you finish, copy the session summary if you want it in notes.",
      },
      {
        q: "Are answers saved?",
        a: "Yes — turns land in prep memory, and past sessions stay in the list so you can reopen them.",
      },
    ],
    quickLinks: [
      { label: "Open Pipeline", to: "/applications" },
      { label: "Open Analyze", to: "/analyze" },
      { label: "Update Profile", to: "/profile" },
    ],
  },
  {
    path: "/cover-letter",
    pageLabel: "Letters",
    title: "Letter studio",
    copy: "Draft a cover letter from a pinned role + CV memory. Edit, copy, and optionally save on a Pipeline application.",
    fabHint: "Letters help",
    tipsTitle: "How to use it",
    tips: [
      {
        q: "What should I pick?",
        a: "A Board role + locker CV, or a Pipeline match. Paste an Analyze summary if you have one.",
      },
      {
        q: "Will it invent experience?",
        a: "It is instructed not to. Thin CV memory still produces cautious, shorter letters.",
      },
      {
        q: "Where is it saved?",
        a: "Only when you use a Pipeline match with “Save draft” on. Otherwise copy the text yourself.",
      },
    ],
    quickLinks: [
      { label: "Open Analyze", to: "/analyze" },
      { label: "Open Pipeline", to: "/applications" },
      { label: "Open Locker", to: "/cvs" },
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
