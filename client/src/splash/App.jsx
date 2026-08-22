import React, { useState, useEffect } from 'react';
import './Splash.css';

function App() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 5;
      });
    }, 120);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (progress === 100) {
      const timer = setTimeout(() => {
        window.location.href = '/buyer/';
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [progress]);

  return (
    <div className="splash-container">
      <div className="splash-grid-bg"></div>
      <div className="splash-overlay">
        <div className="splash-card">
          <h1 className="splash-logo">HomeFind</h1>
          <p className="splash-tagline">Elegance in Every Home</p>
          <div className="progress-bar-container">
            <div 
              className="progress-bar-fill" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <span className="progress-text">{progress}%</span>
        </div>
      </div>
    </div>
  );
}

export default App;
