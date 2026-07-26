import { useId } from "react";

interface ConfirmCardProps {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirming?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmCard({
  title,
  description,
  confirmLabel = "Yes, delete",
  cancelLabel = "Cancel",
  confirming = false,
  onConfirm,
  onCancel,
}: ConfirmCardProps) {
  const titleId = useId();
  const descId = useId();

  return (
    <div
      className="confirm-card"
      role="alertdialog"
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
    >
      <div className="confirm-card-copy">
        <p id={titleId} className="confirm-card-title">
          {title}
        </p>
        {description ? (
          <p id={descId} className="confirm-card-desc">
            {description}
          </p>
        ) : null}
      </div>
      <div className="confirm-card-actions">
        <button type="button" className="btn-ghost" disabled={confirming} onClick={onCancel}>
          {cancelLabel}
        </button>
        <button type="button" className="btn-danger" disabled={confirming} onClick={onConfirm}>
          {confirming ? "Deleting..." : confirmLabel}
        </button>
      </div>
    </div>
  );
}
