import { useState, type ReactNode } from 'react';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Screen } from '../components/Screen';
import { Segmented, Stepper, Toggle } from '../components/Toggle';
import { playSfx } from '../audio/sfx';
import { useApp } from '../state/AppContext';
import { LIMITS } from '../state/types';

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
      <Row title="Survival lives" hint="Wrong answers cost one life">
        <Stepper label="lives" value={settings.lives} min={LIMITS.lives.min} max={LIMITS.lives.max} onChange={(lives) => updateSettings({ lives })} />
      </Row>
      <Row title="Speed round" hint="Seconds on the clock">
        <Segmented label="Speed round seconds" options={LIMITS.speedSeconds} value={settings.speedSeconds as (typeof LIMITS.speedSeconds)[number]} onChange={(speedSeconds) => updateSettings({ speedSeconds })} format={(v) => `${v}s`} />
      </Row>
      <Row title="Team turns" hint="Turns per player">
        <Segmented label="Team turns" options={LIMITS.teamTurns} value={settings.teamTurns as (typeof LIMITS.teamTurns)[number]} onChange={(teamTurns) => updateSettings({ teamTurns })} />
      </Row>
      <p className="mt-2 font-hand text-xl text-white/80">Changes apply to the next game you start.</p>

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
