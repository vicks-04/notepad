function formatDate(value) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export default function NoteHistory({
  versions,
  loading,
  pagination,
  page,
  setPage,
  onRestore,
  restoringVersionId
}) {
  return (
    <section className="history-card">
      <div className="history-card__header">
        <div>
          <p className="section-label">Version History</p>
          <h3>Previous snapshots</h3>
        </div>
      </div>

      {loading ? <p className="history-card__feedback">Loading history...</p> : null}

      {!loading && versions.length === 0 ? (
        <p className="history-card__feedback">This note does not have older versions yet.</p>
      ) : null}

      {!loading && versions.length > 0 ? (
        <div className="history-list">
          {versions.map((version) => (
            <article key={version.id} className="history-item">
              <div>
                <strong>{version.title}</strong>
                <p>{version.content.slice(0, 120) || "Empty note snapshot"}</p>
                <small>
                  Saved {formatDate(version.createdAt)} from note state updated {formatDate(version.snapshotUpdatedAt)}
                </small>
              </div>
              <button
                className="button button--ghost"
                disabled={restoringVersionId === version.id}
                onClick={() => onRestore(version.id)}
              >
                {restoringVersionId === version.id ? "Restoring..." : "Restore"}
              </button>
            </article>
          ))}
        </div>
      ) : null}

      <div className="pagination">
        <button className="button button--ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>
          Prev
        </button>
        <span>
          Page {pagination.page} of {pagination.totalPages}
        </span>
        <button
          className="button button--ghost"
          disabled={page >= pagination.totalPages}
          onClick={() => setPage(page + 1)}
        >
          Next
        </button>
      </div>
    </section>
  );
}

