import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import Button from '../components/ui/Button';

const NotFound: React.FC = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
    <div className="text-8xl font-black text-primary-100 dark:text-primary-900/30">404</div>
    <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50 -mt-4">Page not found</h1>
    <p className="text-surface-500 dark:text-surface-400 max-w-sm">
      The page you're looking for doesn't exist or has been moved.
    </p>
    <div className="flex gap-3 mt-2">
      <Button variant="secondary" icon={<ArrowLeft size={16} />} onClick={() => window.history.back()}>
        Go Back
      </Button>
      <Link to="/dashboard">
        <Button icon={<Home size={16} />}>Dashboard</Button>
      </Link>
    </div>
  </div>
);

export default NotFound;
