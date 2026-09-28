type MentorSuggestionsProps = {
  disabled: boolean;
  onSelect: (suggestion: string) => void;
  suggestions: string[];
};

export function MentorSuggestions({
  disabled,
  onSelect,
  suggestions,
}: MentorSuggestionsProps) {
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="ml-12 flex flex-wrap gap-2">
      {suggestions.map((suggestion) => (
        <button
          className="glass-control rounded-md px-3 py-2 text-left text-xs font-semibold text-slate-800 transition hover:border-blue-300 disabled:opacity-50"
          disabled={disabled}
          key={suggestion}
          onClick={() => onSelect(suggestion)}
          type="button"
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
}
