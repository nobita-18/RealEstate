import React from 'react';
import { useLocation } from 'react-router-dom';
import './PageTransition.css';

const PageTransition = ({ children }) => {
  const location = useLocation();
  return (
    <div key={location.pathname + location.search} className="page-transition-wrapper">
      {children}
    </div>
  );
};

export default PageTransition;
