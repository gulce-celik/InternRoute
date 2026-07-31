import { formatHistoryTime } from "../utils/agentHistory";

export type AgentHistoryItem = {
  id: string;
  createdAt: string;
  label: string;
  subtitle?: string;
  badge?: string;
};

type Props = {
  title: string;
  emptyText: string;
  items: AgentHistoryItem[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  /** Nest under another panel without a second card chrome */
  embedded?: boolean;
};

export default function AgentHistoryPanel({
  title,
  emptyText,
  items,
  activeId,
  onSelect,
  onRemove,
  onClear,
  embedded = false,
}: Props) {
  const Wrapper = embedded ? "div" : "article";

  return (
    <Wrapper className={`session-rail${embedded ? " session-rail--embedded" : " panel"}`}>
      <div className="session-rail-head">
        <h2>{title}</h2>
        {items.length > 0 ? (
          <button type="button" className="btn-ghost session-rail-clear" onClick={onClear}>
            Clear
          </button>
        ) : null}
      </div>

      {items.length === 0 ? (
        <p className="muted session-rail-empty">{emptyText}</p>
      ) : (
        <ul className="session-rail-list">
          {items.map((item) => (
            <li key={item.id} className="session-rail-row">
              <button
                type="button"
                className={`session-rail-item${item.id === activeId ? " session-rail-item--active" : ""}`}
                onClick={() => onSelect(item.id)}
              >
                <span className="session-rail-item-label" title={item.label}>
                  {item.label}
                </span>
                {item.subtitle ? (
                  <span className="session-rail-item-sub" title={item.subtitle}>
                    {item.subtitle}
                  </span>
                ) : null}
                <span className="session-rail-item-meta">
                  {item.badge ? <strong>{item.badge}</strong> : null}
                  <span>{formatHistoryTime(item.createdAt)}</span>
                </span>
              </button>
              <button
                type="button"
                className="session-rail-remove"
                aria-label={`Remove ${item.label}`}
                onClick={() => onRemove(item.id)}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </Wrapper>
  );
}
