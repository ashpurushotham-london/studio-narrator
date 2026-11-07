import { useState, type ReactNode } from 'react';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Screen } from '../components/Screen';
import { Toggle } from '../components/Toggle';
import { playSfx } from '../audio/sfx';
import { useApp } from '../state/AppContext';

function Row({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b-[3px] border-white/25 py-4">
      <div>
        <div className="font-display text-2xl font-bold">{title}</div>
        {hint && <div className="font-hand text-xl text-white/80">{hint}</div>}
      </div>
      {children}
    </div>
  );
}

export function SettingsScreen() {
  const { state, updateSettings, resetAll } = useApp();
  const { settings } = state;
  const [confirm, setConfirm] = useState(false);

  return (
    <Screen title="Settings" back="menu">
      <Row title="Sound effects" hint="Subtle bleeps and bloops">
        <Toggle label="Sound effects" on={settings.sound} onChange={(sound) => { updateSettings({ sound }); if (sound) setTimeout(() => playSfx('correct'), 30); }} />
      </Row>
      <div className="mt-8 pb-6">
        <Button variant="red" onClick={() => setConfirm(true)}>
          Reset all progress
        </Button>
      </div>

      <Modal open={confirm} title="Reset everything?" onClose={() => setConfirm(false)}>
        <p className="mb-5 font-hand text-2xl text-white/85">This wipes your stats, personal bests, daily results, settings and any saved game. It can't be undone.</p>
        <div className="flex flex-col gap-3">
          <Button variant="red" onClick={() => { setConfirm(false); resetAll(); }}>
            Yes, wipe it
          </Button>
          <Button variant="ghost" onClick={() => setConfirm(false)}>
            Cancel
          </Button>
        </div>
      </Modal>
    </Screen>
  );
}
