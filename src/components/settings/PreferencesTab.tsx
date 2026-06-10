import { usePrefsStore, type Currency, type WeekStart } from '../../stores/prefsStore';
import { SettingRow, Toggle } from './SettingRow';

const CURRENCIES: { value: Currency; label: string }[] = [
  { value: 'HKD', label: 'HKD — Hong Kong dollar' },
  { value: 'USD', label: 'USD — US dollar' },
  { value: 'SGD', label: 'SGD — Singapore dollar' },
  { value: 'CNY', label: 'CNY — Chinese yuan' },
];

export function PreferencesTab() {
  const prefs = usePrefsStore();

  return (
    <div className="settings-two-col">
      <div className="settings-card">
        <h3>Appearance</h3>
        <SettingRow title="Theme" desc="Dark mode is easier on the eyes at night.">
          <div className="settings-tag-toggle">
            <button
              type="button"
              className={prefs.theme === 'dark' ? 'on' : ''}
              onClick={() => prefs.setTheme('dark')}
            >
              Dark
            </button>
            <button
              type="button"
              className={prefs.theme === 'light' ? 'on' : ''}
              onClick={() => prefs.setTheme('light')}
            >
              Light
            </button>
          </div>
        </SettingRow>
        <SettingRow
          title="Layout"
          desc="Sidebar feels native on desktop; top-nav scales better on tablets."
        >
          <div className="settings-tag-toggle">
            <button
              type="button"
              className={prefs.layout === 'sidebar' ? 'on' : ''}
              onClick={() => prefs.setLayout('sidebar')}
            >
              Sidebar
            </button>
            <button
              type="button"
              className={prefs.layout === 'topnav' ? 'on' : ''}
              onClick={() => prefs.setLayout('topnav')}
            >
              Top nav
            </button>
          </div>
        </SettingRow>
        <SettingRow
          title="Category chip style"
          desc="How category chips render across transaction lists."
        >
          <div className="settings-tag-toggle">
            <button
              type="button"
              className={prefs.chipStyle === 'icon' ? 'on' : ''}
              onClick={() => prefs.setChipStyle('icon')}
            >
              Icon
            </button>
            <button
              type="button"
              className={prefs.chipStyle === 'emoji' ? 'on' : ''}
              onClick={() => prefs.setChipStyle('emoji')}
            >
              Emoji
            </button>
            <button
              type="button"
              className={prefs.chipStyle === 'dot' ? 'on' : ''}
              onClick={() => prefs.setChipStyle('dot')}
            >
              Dot
            </button>
          </div>
        </SettingRow>
      </div>

      <div className="settings-card">
        <h3>Money</h3>
        <SettingRow
          title="Primary currency"
          desc="Used on dashboard and reports."
        >
          <select
            value={prefs.currency}
            onChange={(e) => prefs.setCurrency(e.target.value as Currency)}
            style={{
              padding: '6px 10px',
              borderRadius: 10,
              background: 'var(--surface-2)',
              color: 'var(--text)',
              border: '1px solid var(--border-strong)',
              fontSize: 12.5,
            }}
          >
            {CURRENCIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </SettingRow>
        <SettingRow title="Week starts on" desc="Used for weekly reports.">
          <div className="settings-tag-toggle">
            <button
              type="button"
              className={prefs.weekStartsOn === 'SUN' ? 'on' : ''}
              onClick={() => prefs.setWeekStartsOn('SUN' as WeekStart)}
            >
              Sun
            </button>
            <button
              type="button"
              className={prefs.weekStartsOn === 'MON' ? 'on' : ''}
              onClick={() => prefs.setWeekStartsOn('MON' as WeekStart)}
            >
              Mon
            </button>
          </div>
        </SettingRow>
        <SettingRow
          title="Round to nearest dollar"
          desc="Hide cents in the transactions list."
        >
          <Toggle
            on={prefs.roundToNearestDollar}
            onChange={prefs.setRoundToNearestDollar}
            ariaLabel="Round to nearest dollar"
          />
        </SettingRow>
        <SettingRow
          title="Auto-categorise on import"
          desc="Suggest categories for new uploads. (Heuristic until a smarter rule lands.)"
        >
          <Toggle
            on={prefs.autoCategorizeOnImport}
            onChange={prefs.setAutoCategorizeOnImport}
            ariaLabel="Auto-categorise on import"
          />
        </SettingRow>
      </div>

    </div>
  );
}
