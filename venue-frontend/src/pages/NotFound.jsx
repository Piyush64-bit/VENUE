import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <h1 className="text-9xl font-bold text-venueOrange opacity-20">404</h1>
      <h2 className="text-3xl font-bold text-white -mt-10 mb-4">Page Not Found</h2>
      <p className="text-venueTextMuted max-w-md mb-8">
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </p>
      <Link 
        to="/" 
        className="px-6 py-3 bg-venueOrange hover:bg-venueOrangeHover text-white font-bold rounded-lg transition-colors"
      >
        Go Home
      </Link>
    </div>
  );
};

export default NotFound;
