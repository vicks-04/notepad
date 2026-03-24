import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../lib/api";

function formatDate(value) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export default function SharedNotePage() {
  const { shareToken } = useParams();
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function fetchSharedNote() {
      setLoading(true);
      setError("");

      try {
        const response = await api.notes.getShared(shareToken);

        if (!ignore) {
          setNote(response.note);
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message || "Unable to load shared note.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    fetchSharedNote();

    return () => {
      ignore = true;
    };
  }, [shareToken]);

  return (
    <div className="shared-note-page">
      <section className="shared-note-card">
        <p className="section-label">Shared Note</p>
        {loading ? <p>Loading shared note...</p> : null}
        {!loading && error ? <p className="panel-message panel-message--error">{error}</p> : null}
        {!loading && note ? (
          <>
            <h1>{note.title}</h1>
            <div className="shared-note-card__meta">
              <span>Read only</span>
              <span>Updated {formatDate(note.updatedAt)}</span>
            </div>
            {note.tags?.length ? (
              <div className="note-card__tags">
                {note.tags.map((tag) => (
                  <span key={tag} className="tag-pill">
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
            <article className="shared-note-card__content">{note.content || "This shared note is empty."}</article>
          </>
        ) : null}
      </section>
    </div>
  );
}
