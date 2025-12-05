import { Routes, Route, useLocation } from 'react-router-dom';
import Layout from './components/layout/Layout';
import UserDashboard from './pages/UserDashboard';
import AnalystDashboard from './pages/AnalystDashboard';
import { useEffect } from 'react';
import { gsap } from 'gsap';

function App() {
  const location = useLocation();

  // GSAP for smooth page transition effect
  useEffect(() => {
    // Fade out old page content
    gsap.to('.page-transition', {
      opacity: 0,
      duration: 0.2,
      ease: 'power2.inOut',
      onComplete: () => {
        // Fade in new page content
        gsap.to('.page-transition', {
          opacity: 1,
          duration: 0.3,
          ease: 'power2.inOut',
        });
      },
    });
  }, [location]);

  return (
    <div className="min-h-screen bg-primary-dark">
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route path="user" element={<UserDashboard />} />
          <Route path="analyst" element={<AnalystDashboard />} />
          {/* Default route */}
          <Route path="*" element={<UserDashboard />} /> 
        </Route>
      </Routes>
    </div>
  );
}

export default App;