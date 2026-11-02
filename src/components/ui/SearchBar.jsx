export default function SearchBar({ value, onChange, placeholder = 'بحث...' }) {
  return (
    <div className="relative mb-4">
      <i className="fas fa-search absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pr-11 pl-4 py-2.5 border border-slate-200 rounded-xl text-sm 
          focus:outline-none focus:ring-2 focus:ring-primary-600"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500"
        >
          <i className="fas fa-times-circle" />
        </button>
      )}
    </div>
  );
}