export default function NoteEditorForm({
  note,
  title,
  content,
  tagsInput,
  onTitleChange,
  onContentChange,
  onTagsChange,
  onSave,
  onTogglePin,
  onArchiveToggle,
  onTrash,
  onRestoreFromTrash,
  onPermanentDelete,
  onShare,
  isSaving,
  isAutosaving,
  isDirty,
  saveMessage,
  actionMessage
}) {
  const isReadOnly = note.isDeleted;

  return (
    <section className="editor-card">
      <div className="editor-card__header">
        <div>
          <p className="section-label">Editor</p>
          <h2>{note.isDeleted ? "Trash preview" : "Update your note"}</h2>
          <div className="editor-card__badges">
            {note.isPinned ? <span className="note-badge">Pinned</span> : null}
            {note.isArchived ? <span className="note-badge">Archived</span> : null}
            {note.isDeleted ? <span className="note-badge note-badge--danger">Trash</span> : null}
          </div>
        </div>
        <div className="editor-card__actions">
          <span className="editor-card__status">
            {isAutosaving ? "Autosaving..." : saveMessage}
            {actionMessage ? ` | ${actionMessage}` : ""}
          </span>
        </div>
      </div>

      <div className="editor-toolbar">
        <button className="button button--primary" type="button" onClick={onSave} disabled={isSaving || !isDirty}>
          {isSaving ? "Saving..." : "Save"}
        </button>

        {!note.isDeleted ? (
          <button className="button button--ghost" type="button" onClick={onTogglePin}>
            {note.isPinned ? "Unpin note" : "Pin note"}
          </button>
        ) : null}

        {!note.isDeleted ? (
          <button className="button button--ghost" type="button" onClick={onArchiveToggle}>
            {note.isArchived ? "Restore archive" : "Archive note"}
          </button>
        ) : null}

        {!note.isDeleted ? (
          <button className="button button--ghost" type="button" onClick={onShare}>
            Share note
          </button>
        ) : null}

        {!note.isDeleted ? (
          <button className="button button--ghost" type="button" onClick={onTrash}>
            Move to trash
          </button>
        ) : null}

        {note.isDeleted ? (
          <button className="button button--ghost" type="button" onClick={onRestoreFromTrash}>
            Restore from trash
          </button>
        ) : null}

        {note.isDeleted ? (
          <button className="button button--ghost note-action--danger" type="button" onClick={onPermanentDelete}>
            Delete forever
          </button>
        ) : null}
      </div>

      {note.shareUrl ? (
        <div className="share-panel">
          <p className="section-label">Share Link</p>
          <a href={note.shareUrl} target="_blank" rel="noreferrer">
            {note.shareUrl}
          </a>
        </div>
      ) : null}

      <div className="field-group">
        <label htmlFor="title">Title</label>
        <input id="title" value={title} onChange={(event) => onTitleChange(event.target.value)} disabled={isReadOnly} />
      </div>

      <div className="field-group">
        <label htmlFor="tags">Tags</label>
        <input
          id="tags"
          value={tagsInput}
          onChange={(event) => onTagsChange(event.target.value)}
          placeholder="work, personal, urgent"
          disabled={isReadOnly}
        />
      </div>

      <div className="field-group">
        <label htmlFor="content">Content</label>
        <textarea
          id="content"
          value={content}
          onChange={(event) => onContentChange(event.target.value)}
          placeholder="Start writing..."
          disabled={isReadOnly}
        />
      </div>
    </section>
  );
}
