import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    // You can replace this with a proper loading spinner component later
    return (
      <div className="min-h-screen flex items-center justify-center bg-bgPrimary text-accentOrange">
        <div className="w-10 h-10 border-2 border-accentOrange border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    // Redirect to login but save the attempted location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
