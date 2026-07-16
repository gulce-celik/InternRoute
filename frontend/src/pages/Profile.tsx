import { useEffect, useMemo, useState, type FormEvent } from "react";

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
] as const;

function parseSectors(raw: string): string[] {
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function yearLabel(value: string): string {
  if (!value) {
    return "";
  }
  return STUDY_YEARS.find((option) => option.value === value)?.label ?? "";
}

function initialsFrom(name: string, email?: string | null): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  if (parts[0]?.length >= 2) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (email ?? "IR").slice(0, 2).toUpperCase();
}

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

  const selectedSectors = useMemo(() => parseSectors(targetSectors), [targetSectors]);
  const displayName = fullName.trim() || user?.email?.split("@")[0] || "Student";
  const yearText = yearLabel(studyYear);

  function toggleSector(sector: string) {
    if (selectedSectors.includes(sector)) {
      setTargetSectors(selectedSectors.filter((item) => item !== sector).join(", "));
      return;
    }
    setTargetSectors([...selectedSectors, sector].join(", "));
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
      setSuccess("Saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="page-section profile-page">
      <div className="page-hero page-hero--animated profile-hero">
        <p className="page-kicker">Account</p>
        <h1>
          Your <em>profile</em>
        </h1>
      </div>

      {error ? <p className="error banner-error">{error}</p> : null}
      {success ? <p className="banner-success">{success}</p> : null}

      <div className="profile-shell">
        <AnimatedCard delay={40}>
          <aside className="profile-identity" aria-label="Current user">
            <div className="profile-avatar" aria-hidden="true">
              {initialsFrom(fullName, user?.email)}
            </div>
            <h2 className="profile-identity-name">{displayName}</h2>
            <p className="profile-identity-email">{user?.email}</p>
            {university.trim() || yearText || major.trim() ? (
              <ul className="profile-identity-facts">
                {university.trim() ? <li>{university.trim()}</li> : null}
                {yearText ? <li>{yearText}</li> : null}
                {major.trim() ? <li>{major.trim()}</li> : null}
              </ul>
            ) : null}
            {selectedSectors.length > 0 ? (
              <div className="profile-identity-sectors">
                {selectedSectors.slice(0, 4).map((sector) => (
                  <span key={sector}>{sector}</span>
                ))}
                {selectedSectors.length > 4 ? (
                  <span>+{selectedSectors.length - 4}</span>
                ) : null}
              </div>
            ) : null}
          </aside>
        </AnimatedCard>

        <AnimatedCard delay={100}>
          <form onSubmit={handleSubmit} className="profile-form panel">
            <div className="profile-fields">
              <label>
                Full name
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your name"
                  autoComplete="name"
                />
              </label>

              <label>
                University
                <input
                  type="text"
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  placeholder="e.g. Istanbul Technical University"
                  autoComplete="organization"
                />
              </label>

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
                Major
                <input
                  type="text"
                  value={major}
                  onChange={(e) => setMajor(e.target.value)}
                  placeholder="e.g. Computer Engineering"
                />
              </label>
            </div>

            <div className="profile-sectors">
              <span className="profile-sectors-title">Target sectors</span>
              <div className="sector-chips" role="group" aria-label="Sector suggestions">
                {SECTOR_SUGGESTIONS.map((sector) => {
                  const active = selectedSectors.includes(sector);
                  return (
                    <button
                      key={sector}
                      type="button"
                      className={`sector-chip${active ? " sector-chip--active" : ""}`}
                      onClick={() => toggleSector(sector)}
                      aria-pressed={active}
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
                rows={2}
                placeholder="Or type your own, comma separated"
                aria-label="Target sectors"
              />
            </div>

            <div className="profile-actions">
              <button type="submit" disabled={submitting}>
                {submitting ? "Saving…" : "Save profile"}
              </button>
            </div>
          </form>
        </AnimatedCard>
      </div>
    </section>
  );
}
