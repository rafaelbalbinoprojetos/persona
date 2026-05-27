import { AuthGate } from './components/auth/AuthGate.jsx';
import ClientLanding from './pages/ClientLanding.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import OnboardingPage from './pages/OnboardingPage.jsx';
import PreviewPage from './pages/PreviewPage.jsx';
import SaaSHome from './pages/SaaSHome.jsx';

export default function App() {
  const pathname = window.location.pathname;

  if (pathname === '/onboarding') {
    return (
      <AuthGate>
        <OnboardingPage />
      </AuthGate>
    );
  }

  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
    return (
      <AuthGate>
        <DashboardPage />
      </AuthGate>
    );
  }

  if (pathname === '/demo/sorrisopro' || pathname === '/sorrisopro') {
    return <ClientLanding />;
  }

  if (pathname.startsWith('/preview/')) {
    return <PreviewPage />;
  }

  return (
    <SaaSHome />
  );
}
