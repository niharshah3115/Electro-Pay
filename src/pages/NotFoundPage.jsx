import React from 'react';
import { Link } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { Button } from '../components/common/Button';

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-brand-500/15 border border-brand-500/30 flex items-center justify-center text-brand-400 mb-4 shadow-xl">
        <Zap className="w-8 h-8" />
      </div>

      <h1 className="text-3xl font-extrabold text-white">404 - Page Not Found</h1>
      <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-sm">
        The requested page does not exist or has been moved.
      </p>

      <Link to="/" className="mt-6">
        <Button variant="primary">Return to Dashboard</Button>
      </Link>
    </div>
  );
}
