function formatDate(value) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export default function NoteActivityLog({ activityLog, loading }) {
  return (
    <section className="history-card">
      <div className="history-card__header">
        <div>
          <p className="section-label">Activity Log</p>
          <h3>Latest actions</h3>
        </div>
      </div>

      {loading ? <p className="history-card__feedback">Loading activity...</p> : null}

      {!loading && activityLog.length === 0 ? (
        <p className="history-card__feedback">No activity has been recorded for this note yet.</p>
      ) : null}

      {!loading && activityLog.length > 0 ? (
        <div className="history-list">
          {activityLog.map((item, index) => (
            <article key={`${item.action}-${item.createdAt}-${index}`} className="history-item">
              <div>
                <strong>{item.action.replaceAll("_", " ")}</strong>
                <p>{item.details || "Action recorded."}</p>
              </div>
              <small>{formatDate(item.createdAt)}</small>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
