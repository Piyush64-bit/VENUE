import { Suspense } from 'react';
import { BrowserRouter as Router, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/layout/Footer';
import NotificationToast from './components/NotificationToast';
import ParticleBackground from './components/ParticleBackground';
import { GlobalErrorBoundary } from './components/ui/GlobalErrorBoundary';
import ScrollToTop from './components/layout/ScrollToTop';
import SmoothScroll from './components/layout/SmoothScroll';
import AppRoutes from './routes/AppRoutes';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-bgPrimary" />
  );
}

function Layout() {
  const location = useLocation();
  const isLanding = location.pathname === '/';
  
  // focused paths where we hide nav/footer
  const isFocusedFlow = location.pathname.includes('/slots') || location.pathname.includes('/seats') || location.pathname.includes('/checkout');

  return (
    <div className="min-h-screen bg-bgPrimary text-textPrimary font-sans selection:bg-accentOrange selection:text-white">
      {!isFocusedFlow && <Navbar />}
      <NotificationToast />
      <main className={`min-h-screen w-full ${isLanding || isFocusedFlow ? '' : 'pt-24 px-6 md:px-0 max-w-[1200px] mx-auto'}`}>
        <GlobalErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            <AppRoutes />
          </Suspense>
        </GlobalErrorBoundary>
      </main>
      {!isFocusedFlow && <Footer />}
    </div>
  );
}

function AppContent() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen bg-bgPrimary" />;
  }

  return (
    <>
      <ParticleBackground />
      <Layout />
    </>
  );
}

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <Router>
          <ScrollToTop />
          <AuthProvider>
            <SmoothScroll>
              <AppContent />
            </SmoothScroll>
          </AuthProvider>
        </Router>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
