import React, { useState } from 'react';
import FixedLayoutStyleApp from './FixedLayoutStyleApp';
import LoiteringPage from './components/LoiteringPage';

function App() {
  const [view, setView] = useState('dashboard'); // 'dashboard' or 'loitering'

  if (view === 'loitering') {
    return <LoiteringPage onBack={() => setView('dashboard')} />;
  }

  return <FixedLayoutStyleApp onOpenLoitering={() => setView('loitering')} />;
}

export default App;
