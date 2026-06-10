import { useState } from 'react';
import { Page } from '../../components/shell/Page';
import { TopBar } from '../../components/shell/TopBar';
import { ProfileTab } from '../../components/settings/ProfileTab';
import { PreferencesTab } from '../../components/settings/PreferencesTab';
import '../../components/dashboard/dashboard.css';
import '../../components/settings/settings.css';

type Tab = 'profile' | 'preferences';

const TABS: { id: Tab; label: string }[] = [
  { id: 'profile', label: 'Profile' },
  { id: 'preferences', label: 'Preferences' },
];

export function SettingsScreen() {
  const [tab, setTab] = useState<Tab>('profile');

  return (
    <>
      <TopBar title="Settings" breadcrumb="Account & preferences" hideSearch />
      <Page>
        <div className="settings-tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={tab === t.id ? 'active' : ''}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'profile' && <ProfileTab />}
        {tab === 'preferences' && <PreferencesTab />}
      </Page>
    </>
  );
}
