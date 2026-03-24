import { Link } from "react-router-dom";

function formatDate(value) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

export default function NoteCard({ note, active = false, onPinToggle, onArchiveToggle, onTrash }) {
  return (
    <article className={`note-card note-card--premium ${active ? "note-card--active" : ""}`}>
      <Link className="note-card__link" to={`/notes/${note.id}`}>
        <div className="note-card__title-row">
          <strong>{note.title}</strong>
          <div className="note-card__status">
            {note.isPinned ? <span className="note-badge">Pinned</span> : null}
            {note.isArchived ? <span className="note-badge">Archived</span> : null}
            {note.isDeleted ? <span className="note-badge note-badge--danger">Trash</span> : null}
          </div>
        </div>
        <p className="note-card__excerpt">{note.excerpt || "Empty note"}</p>
        <div className="note-card__tags">
          {note.tags?.slice(0, 3).map((tag) => (
            <span key={tag} className="tag-pill">
              {tag}
            </span>
          ))}
        </div>
        <small>Updated {formatDate(note.updatedAt)}</small>
      </Link>

      {!note.isDeleted ? (
        <div className="note-card__actions">
          <button className="note-action" type="button" onClick={() => onPinToggle(note.id)}>
            {note.isPinned ? "Unpin" : "Pin"}
          </button>
          <button className="note-action" type="button" onClick={() => onArchiveToggle(note.id)}>
            {note.isArchived ? "Restore" : "Archive"}
          </button>
          <button className="note-action note-action--danger" type="button" onClick={() => onTrash(note.id)}>
            Trash
          </button>
        </div>
      ) : null}
    </article>
  );
}

