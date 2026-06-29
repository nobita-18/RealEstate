import React, { useEffect } from 'react';
import './Splash.css';
import '../components/CinematicPan.css';

function App() {
  useEffect(() => {
    // Navigate to buyer after 3 seconds
    const timer = setTimeout(() => {
      window.location.href = '/buyer/';
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="splash-container">
      <div className="cinematic-pan-bg"></div>
      <div className="splash-overlay">
        <h1 className="splash-logo">LuxeBlue</h1>
      </div>
    </div>
  );
}

export default App;
