import { ErrorBoundary } from 'react-error-boundary';
import { Button } from './Button';

const ErrorFallback = ({ error, resetErrorBoundary }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-bgPrimary text-center">
      <div className="bg-bgCard border border-borderSubtle p-8 rounded-2xl max-w-md w-full shadow-2xl">
        <h2 className="text-2xl font-bold text-red-500 mb-4">Something went wrong</h2>
        <p className="text-textMuted mb-6 text-sm">
          {error.message || "An unexpected error occurred."}
        </p>
        <Button 
          onClick={resetErrorBoundary}
          variant="primary"
          className="w-full"
        >
          Try again
        </Button>
      </div>
    </div>
  );
};

export const GlobalErrorBoundary = ({ children }) => {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => {
        // Reset the state of your app so the error doesn't happen again
        window.location.reload();
      }}
    >
      {children}
    </ErrorBoundary>
  );
};
