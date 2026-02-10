import { Suspense } from 'react';
import { BrowserRouter as Router, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/layout/Footer';
import OrganizerNavbar from './components/organizer/OrganizerNavbar';
import OrganizerFooter from './components/organizer/OrganizerFooter';
import NotificationToast from './components/NotificationToast';
import { Toaster } from 'react-hot-toast';

import { GlobalErrorBoundary } from './components/ui/GlobalErrorBoundary';
import ScrollToTop from './components/layout/ScrollToTop';
import BottomNav from './components/layout/BottomNav';

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
  
  // Check if we're on an organizer route
  const isOrganizerRoute = location.pathname.startsWith('/organizer');
  
  // Auth pages (login/register for both user and organizer)
  const isAuthPage = location.pathname === '/login' || 
                     location.pathname === '/register' ||
                     location.pathname === '/organizer/login' ||
                     location.pathname === '/organizer/register';
  
  // focused paths where we hide nav/footer
  const isFocusedFlow = location.pathname.includes('/slots') || 
                        location.pathname.includes('/seats') || 
                        location.pathname.includes('/checkout') ||
                        isAuthPage;

  return (
    <div className="min-h-screen bg-bgPrimary text-textPrimary font-sans selection:bg-accentOrange selection:text-white">
      {!isFocusedFlow && (isOrganizerRoute ? <OrganizerNavbar /> : <Navbar />)}
      <NotificationToast />
      <main className={`min-h-screen w-full ${isLanding || isFocusedFlow ? '' : 'pt-24 px-6 md:px-0 max-w-[1200px] mx-auto'}`}>
        <GlobalErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            <AppRoutes />
          </Suspense>
        </GlobalErrorBoundary>
      </main>
      {!isFocusedFlow && (isOrganizerRoute ? <OrganizerFooter /> : <Footer />)}
      {!isFocusedFlow && !isOrganizerRoute && <BottomNav />}
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
      <Layout />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <ScrollToTop />
        <AuthProvider>
            <AppContent />
        </AuthProvider>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1a1a1a',
              color: '#fff',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            },
            success: {
              iconTheme: {
                primary: '#FF6B35',
                secondary: '#fff',
              },
            },
          }}
        />
      </Router>
    </QueryClientProvider>
  );
}

export default App;
