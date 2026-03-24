import Sidebar from "./Sidebar";

export default function AppShell({ children, user, notesProps, tasksProps, topbar, onCreateNote, onCreateTask }) {
  return (
    <div className="app-shell">
      <Sidebar notesProps={notesProps} tasksProps={tasksProps} onCreateNote={onCreateNote} onCreateTask={onCreateTask} />
      <div className="app-shell__content">
        {topbar}
        <main className="app-shell__main">{children}</main>
      </div>
    </div>
  );
}
