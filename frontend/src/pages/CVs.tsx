import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type FormEvent,
} from "react";

import AnimatedCard from "../components/AnimatedCard";
import ConfirmCard from "../components/ConfirmCard";
import { ListSkeleton } from "../components/Skeleton";
import { useToast } from "../components/ToastProvider";
import { useAuth } from "../hooks/useAuth";
import { deleteCV, listCVs, openCVFile, uploadCV } from "../services/api";
import type { CV } from "../types/cv";

const MAX_CV_BYTES = 10 * 1024 * 1024; // 10 MB client guard
const MAX_CV_LABEL = "10 MB";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isPdfFile(file: File): boolean {
  const nameOk = file.name.toLowerCase().endsWith(".pdf");
  const typeOk =
    file.type === "" ||
    file.type === "application/pdf" ||
    file.type === "application/x-pdf";
  return nameOk && typeOk;
}

export default function CVsPage() {
  const { token } = useAuth();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cvs, setCvs] = useState<CV[]>([]);
  const [cvName, setCvName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [viewingId, setViewingId] = useState<number | null>(null);

  const loadCvs = useCallback(async () => {
    if (!token) {
      return;
    }

    setLoading(true);

    try {
      const data = await listCVs(token);
      setCvs(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load CVs");
    } finally {
      setLoading(false);
    }
  }, [token, toast]);

  useEffect(() => {
    void loadCvs();
  }, [loadCvs]);

  function clearSelectedFile() {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function acceptFile(file: File | undefined | null) {
    if (!file) {
      return;
    }

    if (!isPdfFile(file)) {
      toast.error("Please upload a PDF file.");
      clearSelectedFile();
      return;
    }

    if (file.size > MAX_CV_BYTES) {
      toast.error(`PDF must be ${MAX_CV_LABEL} or smaller.`);
      clearSelectedFile();
      return;
    }

    setSelectedFile(file);
    if (fileInputRef.current) {
      const transfer = new DataTransfer();
      transfer.items.add(file);
      fileInputRef.current.files = transfer.files;
    }
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (!uploading) {
      setDragActive(true);
    }
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
    if (uploading) {
      return;
    }
    acceptFile(event.dataTransfer.files?.[0]);
  }

  async function handleUpload(event: FormEvent) {
    event.preventDefault();
    if (!token) {
      return;
    }

    const file = selectedFile ?? fileInputRef.current?.files?.[0];
    if (!file) {
      toast.error("Choose a PDF to upload.");
      return;
    }

    if (!isPdfFile(file)) {
      toast.error("Please upload a PDF file.");
      return;
    }

    if (file.size > MAX_CV_BYTES) {
      toast.error(`PDF must be ${MAX_CV_LABEL} or smaller.`);
      return;
    }

    setUploading(true);

    try {
      const created = await uploadCV(token, file, cvName);
      setCvs((prev) => [created, ...prev]);
      toast.success("CV uploaded. You can open the PDF anytime.");
      setCvName("");
      clearSelectedFile();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload CV");
    } finally {
      setUploading(false);
    }
  }

  async function handleView(cv: CV) {
    if (!token) {
      return;
    }

    setViewingId(cv.id);

    try {
      await openCVFile(token, cv.id, cv.filename);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to open CV");
    } finally {
      setViewingId(null);
    }
  }

  async function handleDelete(id: number) {
    if (!token) {
      return;
    }

    setDeletingId(id);

    try {
      await deleteCV(token, id);
      setCvs((prev) => prev.filter((cv) => cv.id !== id));
      setConfirmDeleteId(null);
      toast.success("CV deleted from your locker.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete CV");
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
      </div>

      <div className="jobs-layout">
        <AnimatedCard>
          <article className="panel panel--form">
            <h2>Upload Your CV</h2>
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

              <div className="cv-upload-field">
                <span className="cv-upload-label">CV file</span>
                <div
                  className={`cv-dropzone${dragActive ? " cv-dropzone--active" : ""}${
                    selectedFile ? " cv-dropzone--filled" : ""
                  }`}
                  onDragEnter={handleDragOver}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <input
                    ref={fileInputRef}
                    id="cv-file-input"
                    className="cv-dropzone-input"
                    type="file"
                    accept="application/pdf,.pdf"
                    disabled={uploading}
                    onChange={(event) => acceptFile(event.target.files?.[0])}
                  />
                  <label htmlFor="cv-file-input" className="cv-dropzone-body">
                    {selectedFile ? (
                      <>
                        <strong className="cv-dropzone-filename" title={selectedFile.name}>
                          {selectedFile.name}
                        </strong>
                        <span className="cv-dropzone-meta">
                          {formatFileSize(selectedFile.size)} · PDF ready
                        </span>
                        <span className="cv-dropzone-hint">Click or drop another PDF to replace</span>
                      </>
                    ) : (
                      <>
                        <strong>Drop your PDF here</strong>
                        <span className="cv-dropzone-hint">or click to browse</span>
                      </>
                    )}
                  </label>
                  {selectedFile ? (
                    <button
                      type="button"
                      className="btn-ghost cv-dropzone-clear"
                      disabled={uploading}
                      onClick={clearSelectedFile}
                    >
                      Clear
                    </button>
                  ) : null}
                </div>
                <p className="cv-upload-constraints">PDF only · max {MAX_CV_LABEL}</p>
              </div>

              <button type="submit" disabled={uploading || !selectedFile}>
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
                            <div className="cv-card-heading">
                              <h3 className="cv-card-name" title={cv.name}>
                                {cv.name}
                              </h3>
                              <p className="job-meta">
                                {cv.name === cv.filename ? (
                                  "Ready for applications"
                                ) : (
                                  <>
                                    <span className="cv-card-filename" title={cv.filename}>
                                      {cv.filename}
                                    </span>
                                    <span className="cv-card-filename-suffix">
                                      {" "}
                                      · ready for applications
                                    </span>
                                  </>
                                )}
                              </p>
                            </div>
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
                              <span className="job-date">Uploaded on {formatDate(cv.created_at)}</span>
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
