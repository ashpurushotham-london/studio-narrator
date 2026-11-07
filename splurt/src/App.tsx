import { AnimatePresence } from 'framer-motion';
import { GameScreen } from './screens/GameScreen';
import { HowToScreen } from './screens/HowToScreen';
import { MenuScreen } from './screens/MenuScreen';
import { ModesScreen } from './screens/ModesScreen';
import { ResultsScreen } from './screens/ResultsScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { StatsScreen } from './screens/StatsScreen';
import { TeamSetupScreen } from './screens/TeamSetupScreen';
import { useApp } from './state/AppContext';

const SCREENS = {
  menu: MenuScreen,
  modes: ModesScreen,
  teamSetup: TeamSetupScreen,
  game: GameScreen,
  results: ResultsScreen,
  stats: StatsScreen,
  settings: SettingsScreen,
  howto: HowToScreen,
} as const;

export default function App() {
  const { screen } = useApp();
  const Current = SCREENS[screen];
  return (
    <AnimatePresence mode="wait">
      <Current key={screen} />
    </AnimatePresence>
  );
}
