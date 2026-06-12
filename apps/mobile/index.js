import { registerRootComponent } from 'expo';
import { ExpoRoot } from 'expo-router';

const ctx = require.context('./app');

// Must be exported or Fast Refresh won't update the context
export function App() {
  return <ExpoRoot context={ctx} />;
}

registerRootComponent(App);
