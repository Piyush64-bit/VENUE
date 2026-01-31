import { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../components/layout/ProtectedRoute';

// Static Import for initial page to prevent flicker
import Landing from '../pages/Landing';

// Lazy Load Pages
const Home = lazy(() => import('../pages/Home'));
const Login = lazy(() => import('../pages/Login'));
const Register = lazy(() => import('../pages/Register'));
const Events = lazy(() => import('../pages/Events'));
const Movies = lazy(() => import('../pages/Movies'));
const EventDetails = lazy(() => import('../pages/EventDetails'));
const Slots = lazy(() => import('../pages/Slots'));
const Seats = lazy(() => import('../pages/Seats'));
const Checkout = lazy(() => import('../pages/Checkout'));
const Confirmation = lazy(() => import('../pages/Confirmation'));
const Bookings = lazy(() => import('../pages/Bookings'));
const Profile = lazy(() => import('../pages/Profile'));
const Settings = lazy(() => import('../pages/Settings'));
const Favorites = lazy(() => import('../pages/Favorites'));
const NotFound = lazy(() => import('../pages/NotFound'));

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/home" element={
        <ProtectedRoute>
          <Home />
        </ProtectedRoute>
      } />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      <Route path="/events" element={<Events />} />
      <Route path="/movies" element={<Movies />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/event/:id" element={<EventDetails />} />
      <Route path="/event/:id/slots" element={<Slots />} />
      <Route path="/event/:id/seats" element={<Seats />} />
      
      {/* Protected Routes */}
      <Route path="/event/:id/checkout" element={
        <ProtectedRoute>
          <Checkout />
        </ProtectedRoute>
      } />
      <Route path="/event/:id/confirmation" element={
        <ProtectedRoute>
          <Confirmation />
        </ProtectedRoute>
      } />
      <Route path="/bookings" element={
        <ProtectedRoute>
          <Bookings />
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      } />
      <Route path="/favorites" element={
        <ProtectedRoute>
          <Favorites />
        </ProtectedRoute>
      } />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
