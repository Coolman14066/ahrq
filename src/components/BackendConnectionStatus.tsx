import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

interface BackendStatus {
  isConnected: boolean;
  error: string | null;
  isChecking: boolean;
  lastCheck: Date | null;
}

export const BackendConnectionStatus: React.FC = () => {
  const [status, setStatus] = useState<BackendStatus>({
    isConnected: false,
    error: null,
    isChecking: true,
    lastCheck: null
  });

  const checkBackendHealth = async () => {
    setStatus(prev => ({ ...prev, isChecking: true }));
    
    try {
      const response = await fetch('/api/health', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStatus({
          isConnected: true,
          error: null,
          isChecking: false,
          lastCheck: new Date()
        });
      } else {
        throw new Error(`Server returned ${response.status}`);
      }
    } catch (error) {
      setStatus({
        isConnected: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        isChecking: false,
        lastCheck: new Date()
      });
    }
  };

  useEffect(() => {
    // Initial check
    checkBackendHealth();
    
    // Check every 5 seconds
    const interval = setInterval(checkBackendHealth, 5000);
    
    return () => clearInterval(interval);
  }, []);

  if (status.isConnected) {
    return null; // Don't show anything if connected
  }

  return (
    <div className="fixed top-4 right-4 max-w-md p-4 bg-red-50 border border-red-200 rounded-lg shadow-lg z-50">
      <div className="flex items-start space-x-3">
        <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-red-800">
            Backend Connection Error
          </h3>
          <p className="mt-1 text-sm text-red-700">
            Unable to connect to the backend server at port 3002.
          </p>
          <div className="mt-3 space-y-2">
            <p className="text-sm text-red-600">
              To fix this issue:
            </p>
            <ol className="text-sm text-red-600 list-decimal list-inside space-y-1">
              <li>Stop the frontend server (Ctrl+C)</li>
              <li>Run <code className="px-1 py-0.5 bg-red-100 rounded font-mono">npm run dev:full</code> instead</li>
              <li>Or manually start the backend: <code className="px-1 py-0.5 bg-red-100 rounded font-mono">cd backend && npm run dev</code></li>
            </ol>
          </div>
          <button
            onClick={checkBackendHealth}
            disabled={status.isChecking}
            className="mt-3 px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700 
                     disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${status.isChecking ? 'animate-spin' : ''}`} />
            <span>{status.isChecking ? 'Checking...' : 'Retry'}</span>
          </button>
          {status.error && (
            <p className="mt-2 text-xs text-red-500">
              Error: {status.error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};