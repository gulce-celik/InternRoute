import { useEffect, useState, type FormEvent } from "react";

import AnimatedCard from "../components/AnimatedCard";
import { useAuth } from "../hooks/useAuth";

const STUDY_YEARS = [
  { value: "", label: "Select year" },
  { value: "1", label: "1st year" },
  { value: "2", label: "2nd year" },
  { value: "3", label: "3rd year" },
  { value: "4", label: "4th year" },
  { value: "5", label: "Graduate / Masters" },
  { value: "6", label: "Recent graduate" },
] as const;

const SECTOR_SUGGESTIONS = [
  "Software",
  "AI / ML",
  "Energy",
  "Finance",
  "Manufacturing",
  "Consulting",
  "Healthcare",
  "Automotive",
];

export default function ProfilePage() {
  const { user, updateUserProfile } = useAuth();
  const [fullName, setFullName] = useState("");
  const [university, setUniversity] = useState("");
  const [studyYear, setStudyYear] = useState("");
  const [major, setMajor] = useState("");
  const [targetSectors, setTargetSectors] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }

    setFullName(user.full_name ?? "");
    setUniversity(user.university ?? "");
    setStudyYear(user.study_year ? String(user.study_year) : "");
    setMajor(user.major ?? "");
    setTargetSectors(user.target_sectors ?? "");
  }, [user]);

  function toggleSector(sector: string) {
    const current = targetSectors
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    if (current.includes(sector)) {
      setTargetSectors(current.filter((item) => item !== sector).join(", "));
      return;
    }

    setTargetSectors([...current, sector].join(", "));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await updateUserProfile({
        full_name: fullName.trim() || undefined,
        university: university.trim() || undefined,
        study_year: studyYear ? Number(studyYear) : undefined,
        major: major.trim() || undefined,
        target_sectors: targetSectors.trim() || undefined,
      });
      setSuccess("Profile saved — AI tips will use this in Sprint 3.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="page-section profile-page">
      <div className="page-hero page-hero--animated">
        <p className="page-kicker">Your details</p>
        <h1>
          Student <em>profile</em>
        </h1>
        <p className="page-description">
          Tell us where you study and what sectors you target. Later, our AI agents will personalize
          cover letters, gap analysis, and mock interviews from this.
        </p>
      </div>

      {error && <p className="error banner-error">{error}</p>}
      {success && <p className="banner-success">{success}</p>}

      <AnimatedCard>
        <article className="panel profile-panel">
          <h2>About you</h2>
          <p className="profile-email muted">{user?.email}</p>

          <form onSubmit={handleSubmit} className="profile-form">
            <label>
              Full name
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your name"
              />
            </label>

            <label>
              University
              <input
                type="text"
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                placeholder="e.g. Istanbul Technical University"
              />
            </label>

            <div className="profile-form-row">
              <label>
                Year
                <select value={studyYear} onChange={(e) => setStudyYear(e.target.value)}>
                  {STUDY_YEARS.map((option) => (
                    <option key={option.label} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Major / department
                <input
                  type="text"
                  value={major}
                  onChange={(e) => setMajor(e.target.value)}
                  placeholder="e.g. Computer Engineering"
                />
              </label>
            </div>

            <div className="profile-sectors">
              <label htmlFor="target-sectors">Target sectors</label>
              <p className="field-hint">Pick a few or type your own — comma separated.</p>
              <div className="sector-chips">
                {SECTOR_SUGGESTIONS.map((sector) => {
                  const active = targetSectors
                    .split(",")
                    .map((item) => item.trim())
                    .includes(sector);

                  return (
                    <button
                      key={sector}
                      type="button"
                      className={`sector-chip${active ? " sector-chip--active" : ""}`}
                      onClick={() => toggleSector(sector)}
                    >
                      {sector}
                    </button>
                  );
                })}
              </div>
              <textarea
                id="target-sectors"
                value={targetSectors}
                onChange={(e) => setTargetSectors(e.target.value)}
                rows={3}
                placeholder="Software, Energy, Automotive..."
              />
            </div>

            <button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Save profile"}
            </button>
          </form>
        </article>
      </AnimatedCard>
    </section>
  );
}
