import { useCallback, useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";

import AnimatedCard from "../components/AnimatedCard";
import { useAuth } from "../hooks/useAuth";
import { deleteCV, getMemoryContext, listCVs, openCVFile, uploadCV } from "../services/api";
import type { CV } from "../types/cv";
import type { MemoryContext } from "../types/dashboard";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function CVsPage() {
  const { token } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cvs, setCvs] = useState<CV[]>([]);
  const [memory, setMemory] = useState<MemoryContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
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
      const [data, memoryData] = await Promise.all([listCVs(token), getMemoryContext(token)]);
      setCvs(data);
      setMemory(memoryData);
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
      const created = await uploadCV(token, file);
      setCvs((prev) => [created, ...prev]);
      const memoryData = await getMemoryContext(token);
      setMemory(memoryData);
      setSuccess("CV uploaded. You can open the PDF anytime.");
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
      const memoryData = await getMemoryContext(token);
      setMemory(memoryData);
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
          Keep a version for every company — Siemens CV ≠ startup CV. Upload, view, and reuse PDFs
          when you link applications.
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
            <p className="muted">
              After upload you can open the PDF anytime. Behind the scenes we also index the text
              for Sprint 3 AI agents.
            </p>
          </article>
        </AnimatedCard>

        <AnimatedCard delay={100}>
          <div className="panel">
            <h2>Saved versions</h2>

            {loading ? (
              <p className="muted">Loading your CV locker...</p>
            ) : cvs.length === 0 ? (
              <div className="empty-state">
                <strong>No CVs yet</strong>
                Upload your first PDF — you&apos;ll pick it when linking a job application.
              </div>
            ) : (
              <ul className="jobs-list">
                {cvs.map((cv, index) => (
                  <li key={cv.id}>
                    <AnimatedCard delay={index * 70} className="job-card-wrap">
                      <article className="job-card job-card--float">
                        <div className="job-card-header">
                          <div>
                            <h3>{cv.filename}</h3>
                            <p className="job-meta">PDF · ready for applications</p>
                          </div>
                          <span className="status-badge status-badge--applied">stored</span>
                        </div>
                        <div className="job-card-footer job-card-footer--actions">
                          <span className="job-date">Uploaded {formatDate(cv.created_at)}</span>
                          <div className="cv-card-actions">
                            <button
                              type="button"
                              className="btn-ghost"
                              disabled={viewingId === cv.id}
                              onClick={() => void handleView(cv)}
                            >
                              {viewingId === cv.id ? "Opening..." : "View PDF"}
                            </button>
                            <button
                              type="button"
                              className="btn-danger"
                              disabled={deletingId === cv.id}
                              onClick={() => void handleDelete(cv.id)}
                            >
                              {deletingId === cv.id ? "Deleting..." : "Delete"}
                            </button>
                          </div>
                        </div>
                      </article>
                    </AnimatedCard>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </AnimatedCard>
      </div>

      {memory && memory.cv_chunks > 0 && (
        <AnimatedCard delay={180}>
          <article className="panel memory-panel">
            <p className="page-kicker">RAG · technical preview</p>
            <h2>Indexed for Sprint 3 AI agents</h2>
            <p className="muted">
              This block is <strong>not a student feature</strong>. It shows that your CV text was
              stored in the RAG memory layer so Sprint 3 agents (Analyze, Letters, Mock Interview)
              can use it later. You do not need to read or edit these snippets day to day —{" "}
              <strong>View PDF</strong> above is what you use.
            </p>
            <p className="muted">
              Status: {memory.cv_chunks} chunk{memory.cv_chunks === 1 ? "" : "s"} indexed from your
              uploads.
            </p>
            {memory.snippets.length > 0 && (
              <ul className="memory-snippet-list">
                {memory.snippets.map((snippet) => (
                  <li key={`${snippet.source}-${snippet.snippet.slice(0, 24)}`}>
                    <strong>{snippet.source}</strong>
                    <p>{snippet.snippet}</p>
                  </li>
                ))}
              </ul>
            )}
          </article>
        </AnimatedCard>
      )}
    </section>
  );
}
