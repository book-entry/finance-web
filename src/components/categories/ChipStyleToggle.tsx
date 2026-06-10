import { usePrefsStore, type ChipStyle } from '../../stores/prefsStore';

const OPTIONS: { value: ChipStyle; label: string; example: string }[] = [
  { value: 'icon', label: 'Icon', example: 'G' },
  { value: 'emoji', label: 'Emoji', example: '🥬' },
  { value: 'dot', label: 'Dot', example: '●' },
];

export function ChipStyleToggle() {
  const chipStyle = usePrefsStore((s) => s.chipStyle);
  const setChipStyle = usePrefsStore((s) => s.setChipStyle);

  return (
    <div className="chip-style-toggle" role="tablist" aria-label="Category chip style">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={chipStyle === option.value}
          className={chipStyle === option.value ? 'on' : ''}
          onClick={() => setChipStyle(option.value)}
        >
          <span aria-hidden="true" style={{ fontSize: 11 }}>
            {option.example}
          </span>
          {option.label}
        </button>
      ))}
    </div>
  );
}
