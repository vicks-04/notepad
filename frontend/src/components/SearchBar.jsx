export default function SearchBar({ value, onChange }) {
  return (
    <label className="searchbar">
      <span className="searchbar__icon">Search</span>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search title or content"
      />
    </label>
  );
}

