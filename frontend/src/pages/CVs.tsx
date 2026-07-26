import { useCallback, useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";

import AnimatedCard from "../components/AnimatedCard";
import ConfirmCard from "../components/ConfirmCard";
import { ListSkeleton } from "../components/Skeleton";
import { useAuth } from "../hooks/useAuth";
import { deleteCV, listCVs, openCVFile, uploadCV } from "../services/api";
import type { CV } from "../types/cv";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function CVsPage() {
  const { token } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cvs, setCvs] = useState<CV[]>([]);
  const [cvName, setCvName] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [viewingId, setViewingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadCvs = useCallback(async () => {
    if (!token) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await listCVs(token);
      setCvs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load CVs");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadCvs();
  }, [loadCvs]);

  async function handleUpload(event: FormEvent) {
    event.preventDefault();
    if (!token || !fileInputRef.current?.files?.[0]) {
      return;
    }

    const file = fileInputRef.current.files[0];
    if (file.type !== "application/pdf") {
      setError("Please upload a PDF file.");
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const created = await uploadCV(token, file, cvName);
      setCvs((prev) => [created, ...prev]);
      setSuccess("CV uploaded. You can open the PDF anytime.");
      setCvName("");
      fileInputRef.current.value = "";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload CV");
    } finally {
      setUploading(false);
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files?.[0]) {
      setError(null);
      setSuccess(null);
    }
  }

  async function handleView(cv: CV) {
    if (!token) {
      return;
    }

    setViewingId(cv.id);
    setError(null);

    try {
      await openCVFile(token, cv.id, cv.filename);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to open CV");
    } finally {
      setViewingId(null);
    }
  }

  async function handleDelete(id: number) {
    if (!token) {
      return;
    }

    setDeletingId(id);
    setError(null);

    try {
      await deleteCV(token, id);
      setCvs((prev) => prev.filter((cv) => cv.id !== id));
      setConfirmDeleteId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete CV");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="page-section">
      <div className="page-hero page-hero--animated">
        <p className="page-kicker">Live locker</p>
        <h1>
          Your CV <em>locker</em>
        </h1>
        <p className="page-description">
          Keep a version for every company. Upload, view, and reuse PDFs when you link applications.
        </p>
      </div>

      {error && <p className="error banner-error">{error}</p>}
      {success && <p className="banner-success">{success}</p>}

      <div className="jobs-layout">
        <AnimatedCard>
          <article className="panel panel--form">
            <h2>Upload PDF</h2>
            <form onSubmit={handleUpload} className="job-form">
              <label>
                Name (optional)
                <input
                  type="text"
                  value={cvName}
                  onChange={(event) => setCvName(event.target.value)}
                  placeholder="e.g. InternRoute version"
                  maxLength={255}
                />
              </label>
              <label>
                CV file
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={handleFileChange}
                  required
                />
              </label>
              <button type="submit" disabled={uploading}>
                {uploading ? "Uploading..." : "Add to locker"}
              </button>
            </form>
          </article>
        </AnimatedCard>

        <AnimatedCard delay={100}>
          <div className="panel">
            <h2>Saved versions</h2>

            {loading ? (
              <ListSkeleton count={3} variant="cv" />
            ) : cvs.length === 0 ? (
              <div className="empty-state">
                <strong>No CVs yet</strong>
                Upload your first PDF — you&apos;ll pick it when linking a job application.
              </div>
            ) : (
              <ul className="jobs-list">
                {cvs.map((cv, index) => {
                  const confirming = confirmDeleteId === cv.id;

                  return (
                    <li key={cv.id}>
                      <AnimatedCard delay={index * 70} className="job-card-wrap">
                        <article
                          className={`job-card job-card--float${confirming ? " job-card--confirming" : ""}`}
                        >
                          <div className="job-card-header">
                            <div>
                              <h3>{cv.name}</h3>
                              <p className="job-meta">
                                {cv.name === cv.filename
                                  ? "PDF · ready for applications"
                                  : `${cv.filename} · ready for applications`}
                              </p>
                            </div>
                            <span className="status-badge status-badge--applied">stored</span>
                          </div>
                          {confirming ? (
                            <ConfirmCard
                              title="Delete this CV?"
                              description="Applications using this version may lose the linked file."
                              confirming={deletingId === cv.id}
                              onCancel={() => setConfirmDeleteId(null)}
                              onConfirm={() => void handleDelete(cv.id)}
                            />
                          ) : (
                            <div className="job-card-footer job-card-footer--actions">
                              <span className="job-date">Uploaded {formatDate(cv.created_at)}</span>
                              <div className="cv-card-actions">
                                <button
                                  type="button"
                                  className="btn-ghost"
                                  disabled={viewingId === cv.id || deletingId !== null}
                                  onClick={() => void handleView(cv)}
                                >
                                  {viewingId === cv.id ? "Opening..." : "View PDF"}
                                </button>
                                <button
                                  type="button"
                                  className="btn-danger"
                                  disabled={deletingId !== null}
                                  onClick={() => setConfirmDeleteId(cv.id)}
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          )}
                        </article>
                      </AnimatedCard>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </AnimatedCard>
      </div>
    </section>
  );
}
