import React, {useState, useEffect} from 'react';
import {BackHandler} from 'react-native';
import {HomeScreen} from './src/screens/HomeScreen';
import {SmallContainerScreen} from './src/screens/SmallContainerScreen';
import {MicroDramasScreen} from './src/screens/MicroDramasScreen';

type Screen = 'home' | 'small-container' | 'micro-dramas';

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (screen !== 'home') {
        setScreen('home');
        return true; // consumido — no cierra la app
      }
      return false; // deja que Android cierre la app normalmente
    });
    return () => sub.remove();
  }, [screen]);

  if (screen === 'small-container') {
    return <SmallContainerScreen onBack={() => setScreen('home')} />;
  }
  if (screen === 'micro-dramas') {
    return <MicroDramasScreen onBack={() => setScreen('home')} />;
  }
  return <HomeScreen onNavigate={s => setScreen(s)} />;
}
