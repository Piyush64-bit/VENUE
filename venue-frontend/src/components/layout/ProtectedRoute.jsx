import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bgPrimary text-accentOrange">
        <div className="w-10 h-10 border-2 border-accentOrange border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    // Detect if trying to access organizer route
    const isOrganizerRoute = location.pathname.startsWith('/organizer');
    const redirectTo = isOrganizerRoute ? '/organizer/login' : '/login';
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Strict role-based access control
  const isOrganizerRoute = location.pathname.startsWith('/organizer');
  const isUserRoute = !isOrganizerRoute && !['/login', '/register', '/organizer/login', '/organizer/register', '/'].includes(location.pathname);

  // Prevent organizers from accessing user routes
  if (user.role === 'ORGANIZER' && isUserRoute) {
    return <Navigate to="/organizer/dashboard" replace />;
  }

  // Prevent users from accessing organizer routes
  if (user.role === 'USER' && isOrganizerRoute) {
    return <Navigate to="/home" replace />;
  }

  // Role check for specific protected routes
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Redirect based on user role
    const redirectTo = user.role === 'ORGANIZER' ? '/organizer/dashboard' : '/home';
    return <Navigate to={redirectTo} replace />;
  }

  return children;
};

export default ProtectedRoute;
