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
// Organizer Pages
const OrganizerDashboard = lazy(() => import('../pages/organizer/Dashboard'));
const OrganizerLogin = lazy(() => import('../pages/organizer/OrganizerLogin'));
const OrganizerRegister = lazy(() => import('../pages/organizer/OrganizerRegister'));
const OrganizerEvents = lazy(() => import('../pages/organizer/OrganizerEvents'));
const OrganizerMovies = lazy(() => import('../pages/organizer/OrganizerMovies'));
const EventForm = lazy(() => import('../pages/organizer/EventForm'));
const MovieForm = lazy(() => import('../pages/organizer/MovieForm'));
const SlotManager = lazy(() => import('../pages/organizer/SlotManager'));
const OrganizerSettings = lazy(() => import('../pages/organizer/OrganizerSettings'));
const Profile = lazy(() => import('../pages/Profile'));
const Bookings = lazy(() => import('../pages/Bookings'));
const Settings = lazy(() => import('../pages/Settings'));
const Favorites = lazy(() => import('../pages/Favorites'));
const NotFound = lazy(() => import('../pages/NotFound'));
const OrganizerNotFound = lazy(() => import('../pages/organizer/OrganizerNotFound'));

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
      
      {/* Public Pages */}
      <Route path="/events" element={<Events />} />
      <Route path="/movies" element={<Movies />} />
      <Route path="/profile" element={
        <ProtectedRoute>
            <Profile />
        </ProtectedRoute>
      } />
      
      {/* Detail & Booking Flows */}
      <Route path="/event/:id" element={<EventDetails type="event" />} />
      <Route path="/event/:id/slots" element={<Slots type="event" />} />
      <Route path="/event/:id/seats" element={<Seats />} />

      <Route path="/movies/:id" element={<EventDetails type="movie" />} />
      <Route path="/movies/:id/slots" element={<Slots type="movie" />} />
      <Route path="/movies/:id/seats" element={<Seats type="movie" />} />
      
      <Route path="/event/:id/checkout" element={
        <ProtectedRoute>
          <Checkout type="event" />
        </ProtectedRoute>
      } />
       <Route path="/movies/:id/checkout" element={
        <ProtectedRoute>
          <Checkout type="movie" />
        </ProtectedRoute>
      } />
      
      <Route path="/confirmation" element={
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

      {/* Organizer Auth Routes (Public) */}
      <Route path="/organizer/login" element={<OrganizerLogin />} />
      <Route path="/organizer/register" element={<OrganizerRegister />} />

      {/* Organizer Routes */}
      <Route path="/organizer" element={
        <ProtectedRoute allowedRoles={['ORGANIZER']}>
          <OrganizerDashboard />
        </ProtectedRoute>
      } />
      <Route path="/organizer/dashboard" element={
        <ProtectedRoute allowedRoles={['ORGANIZER']}>
          <OrganizerDashboard />
        </ProtectedRoute>
      } />
      <Route path="/organizer/settings" element={
        <ProtectedRoute allowedRoles={['ORGANIZER']}>
          <OrganizerSettings />
        </ProtectedRoute>
      } />
      
      {/* Organizer Event Routes */}
      <Route path="/organizer/events" element={
        <ProtectedRoute allowedRoles={['ORGANIZER']}>
          <OrganizerEvents />
        </ProtectedRoute>
      } />
      <Route path="/organizer/events/new" element={
        <ProtectedRoute allowedRoles={['ORGANIZER']}>
          <EventForm />
        </ProtectedRoute>
      } />
      <Route path="/organizer/events/:id/edit" element={
        <ProtectedRoute allowedRoles={['ORGANIZER']}>
          <EventForm />
        </ProtectedRoute>
      } />
      <Route path="/organizer/events/:id/slots" element={
        <ProtectedRoute allowedRoles={['ORGANIZER']}>
          <SlotManager type="event" />
        </ProtectedRoute>
      } />

      {/* Organizer Movie Routes */}
      <Route path="/organizer/movies" element={
        <ProtectedRoute allowedRoles={['ORGANIZER']}>
          <OrganizerMovies />
        </ProtectedRoute>
      } />
      <Route path="/organizer/movies/new" element={
        <ProtectedRoute allowedRoles={['ORGANIZER']}>
          <MovieForm />
        </ProtectedRoute>
      } />
      <Route path="/organizer/movies/:id/edit" element={
        <ProtectedRoute allowedRoles={['ORGANIZER']}>
          <MovieForm />
        </ProtectedRoute>
      } />
      <Route path="/organizer/movies/:id/slots" element={
        <ProtectedRoute allowedRoles={['ORGANIZER']}>
          <SlotManager type="movie" />
        </ProtectedRoute>
      } />

      {/* Organizer 404 - Catch all organizer routes */}
      <Route path="/organizer/*" element={<OrganizerNotFound />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
