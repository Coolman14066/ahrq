import AHRQDashboard from './AHRQDashboard';
import { ErrorBoundary } from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <AHRQDashboard />
    </ErrorBoundary>
  );
}

export default App;