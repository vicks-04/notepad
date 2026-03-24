import { useTheme } from "../context/ThemeContext";

function getInitials(user) {
  if (!user?.name) return "CN";

  return user.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function Topbar({ user, searchValue, onSearchChange, searchPlaceholder = "Search", onLogout }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="topbar">
      <label className="topbar__search">
        <span className="topbar__search-icon">⌕</span>
        <input
          type="text"
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={searchPlaceholder}
        />
      </label>

      <div className="topbar__actions">
        <button className="topbar__theme" type="button" onClick={toggleTheme}>
          {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
        </button>

        <div className="topbar__profile">
          <div className="topbar__avatar">{getInitials(user)}</div>
          <div className="topbar__profile-copy">
            <strong>{user?.name || "Workspace"}</strong>
            <span>{user?.email || "cloud notepad"}</span>
          </div>
        </div>

        <button className="button button--ghost" type="button" onClick={onLogout}>
          Logout
        </button>
      </div>
    </header>
  );
}

