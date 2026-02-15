# VENUE Frontend

React-based single-page application for event and movie booking platform.

## Tech Stack

- **Framework:** React 19
- **Build Tool:** Vite
- **Styling:** TailwindCSS
- **Routing:** React Router v7
- **Server State:** TanStack Query (React Query)
- **HTTP Client:** Axios
- **Animations:** Framer Motion
- **Forms:** React Hook Form
- **Testing:** Vitest, React Testing Library

## Key Features

### Server State Management
- TanStack Query for API data caching
- Automatic background refetching
- Optimistic updates
- Request deduplication
- Cache invalidation strategies

### Authentication Flow
- JWT token stored in HttpOnly cookies
- React Context for auth state
- Protected routes with redirects
- Role-based UI rendering
- Automatic token refresh

### Real-Time Updates
- Socket.IO client integration
- Live seat availability
- Instant booking notifications
- Event-based room subscriptions

### Responsive Design
- Mobile-first approach
- TailwindCSS utility classes
- Breakpoint-based layouts
- Touch-optimized interactions

## Project Structure

```
src/
├── components/         # Reusable UI components
│   ├── layout/        # Layout components (Header, Footer, Sidebar)
│   ├── auth/          # Auth forms (Login, Register)
│   ├── event/         # Event-related components
│   ├── booking/       # Booking components
│   └── ui/            # Base UI elements (Button, Card, Modal)
├── pages/             # Route-level page components
│   ├── Home.jsx
│   ├── Events.jsx
│   ├── EventDetail.jsx
│   ├── Movies.jsx
│   ├── MovieDetail.jsx
│   ├── Booking.jsx
│   ├── Profile.jsx
│   └── Dashboard.jsx
├── context/           # React Context
│   └── AuthContext.jsx
├── api/               # API client & React Query hooks
│   ├── axios.js       # Axios instance with interceptors
│   ├── auth.js        # Auth API calls
│   ├── events.js      # Events API calls
│   ├── bookings.js    # Bookings API calls
│   └── queries.js     # React Query hooks
├── routes/            # Route configuration
│   ├── AppRoutes.jsx  # Main routes
│   └── ProtectedRoute.jsx # Auth guard
├── socket/            # Socket.IO client
│   └── socket.js
├── lib/               # Utilities
│   ├── utils.js       # Helper functions
│   └── constants.js   # App constants
├── data/              # Static data
├── assets/            # Images, icons, fonts
├── App.jsx            # Root component
└── main.jsx           # Entry point
```

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Create `.env`:
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### 3. Run Development Server
```bash
npm run dev
```

Application runs at `http://localhost:3000`

## Available Scripts

```bash
npm run dev          # Development server (Vite)
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm test             # Run Vitest tests
npm run test:ui      # Vitest UI mode
npm run test:coverage # Generate coverage report
```

## API Integration

### Axios Configuration
```javascript
// src/api/axios.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true, // Send cookies
});

// Request interceptor
api.interceptors.request.use(config => {
  // Add auth headers
  return config;
});

// Response interceptor
api.interceptors.response.use(
  response => response,
  error => {
    // Handle 401, redirect to login
    return Promise.reject(error);
  }
);

export default api;
```

### React Query Integration
```javascript
// src/api/queries.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getEvents, createBooking } from './bookings';

export const useEvents = () => {
  return useQuery({
    queryKey: ['events'],
    queryFn: getEvents,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCreateBooking = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createBooking,
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries(['bookings']);
      queryClient.invalidateQueries(['slots']);
    },
  });
};
```

## State Management Strategy

### Server State (TanStack Query)
- API data caching
- Background synchronization
- Pagination & infinite scroll
- Optimistic updates
- Error handling & retry logic

### Client State (React Context)
- Authentication state
- User information
- Theme preferences
- UI state (modals, toasts)

### Local State (useState/useReducer)
- Component-specific state
- Form inputs
- UI toggles

## Routing

### Public Routes
- `/` - Home page
- `/events` - Browse events
- `/events/:id` - Event details
- `/movies` - Browse movies
- `/movies/:id` - Movie details
- `/login` - Login page
- `/register` - Register page

### Protected Routes (Authenticated)
- `/profile` - User profile
- `/bookings` - User bookings
- `/dashboard` - User dashboard

### Role-Specific Routes
- `/organizer/dashboard` - Organizer panel
- `/admin/dashboard` - Admin panel

### Protected Route Component
```javascript
// src/routes/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, roles }) => {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" />;
  }
  
  return children;
};

export default ProtectedRoute;
```

## Socket.IO Integration

### Socket Setup
```javascript
// src/socket/socket.js
import io from 'socket.io-client';

const socket = io(import.meta.env.VITE_SOCKET_URL, {
  withCredentials: true,
  autoConnect: false,
});

export default socket;
```

### Usage in Components
```javascript
import { useEffect } from 'react';
import socket from '../socket/socket';

function EventDetail({ eventId }) {
  useEffect(() => {
    socket.connect();
    socket.emit('join-event', eventId);
    
    socket.on('capacity-update', (data) => {
      // Update UI with new capacity
    });
    
    return () => {
      socket.emit('leave-event', eventId);
      socket.disconnect();
    };
  }, [eventId]);
  
  return <div>Event content</div>;
}
```

## Styling

### TailwindCSS Configuration
```javascript
// tailwind.config.js
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',
        secondary: '#10B981',
      },
    },
  },
  plugins: [],
};
```

### Component Styling Example
```javascript
function Button({ children, variant = 'primary' }) {
  const baseClasses = 'px-4 py-2 rounded-lg font-medium transition';
  const variantClasses = {
    primary: 'bg-primary text-white hover:bg-blue-600',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
  };
  
  return (
    <button className={`${baseClasses} ${variantClasses[variant]}`}>
      {children}
    </button>
  );
}
```

## Form Handling

### React Hook Form Integration
```javascript
import { useForm } from 'react-hook-form';

function LoginForm() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  
  const onSubmit = (data) => {
    // Handle login
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input
        {...register('email', { 
          required: 'Email is required',
          pattern: {
            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
            message: 'Invalid email address'
          }
        })}
        type="email"
        placeholder="Email"
      />
      {errors.email && <span>{errors.email.message}</span>}
      
      <button type="submit">Login</button>
    </form>
  );
}
```

## Testing

### Vitest Configuration
```javascript
// vitest.config.js
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
    },
  },
});
```

### Component Test Example
```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Button from './Button';

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
  
  it('calls onClick handler', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledOnce();
  });
});
```

## Build & Deployment

### Production Build
```bash
npm run build
```

Output: `dist/` directory

### Build Optimization
- Code splitting (React.lazy)
- Tree shaking
- Minification
- Asset optimization
- Source maps (configurable)

### Environment Variables
```env
# Development
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000

# Production
VITE_API_URL=https://api.venue.com/api
VITE_SOCKET_URL=https://api.venue.com
```

### Deployment Platforms

**Vercel:**
```bash
npm run build
vercel --prod
```

**Netlify:**
```bash
npm run build
netlify deploy --prod --dir=dist
```

**Docker:**
```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## Performance Optimization

### Implemented
- Code splitting (lazy loading)
- Image optimization (lazy loading)
- React Query caching
- Debounced search inputs
- Memoization (useMemo, useCallback)
- Virtual scrolling for large lists

### Bundle Analysis
```bash
npm run build
npx vite-bundle-visualizer
```

## Browser Support

- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)

## Accessibility

### Implemented Features
- Semantic HTML
- ARIA labels
- Keyboard navigation
- Focus management
- Alt text for images
- Color contrast compliance (WCAG AA)

### Testing
```bash
# Lighthouse audit
npm run build
npx serve dist
# Run Lighthouse in Chrome DevTools
```

## Resources

- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [TanStack Query](https://tanstack.com/query/latest)
- [TailwindCSS Docs](https://tailwindcss.com/docs)
- [React Router](https://reactrouter.com/)
- [Main README](../README.md)

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for development guidelines.

## License

MIT License - see [LICENSE](../LICENSE)
