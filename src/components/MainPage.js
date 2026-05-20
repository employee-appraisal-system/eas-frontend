import React, { useState } from 'react';
import AppLayout from './AppLayout';
import DropdownPage from './employee_assessment';
import HRLandingPage from './HRLandingPage';

const MainPage = () => {
  const [activePage, setActivePage] = useState('hr-dashboard'); // if wanted deafult to be hr-dashboard
  const handleNavigate = (pageId) => {
    setActivePage(pageId);
  };

  return (
    <AppLayout activePage={activePage} onNavigate={handleNavigate}>
      {activePage === 'hr-dashboard' ? <HRLandingPage /> : <DropdownPage />}
    </AppLayout>
  );
};

export default MainPage;
