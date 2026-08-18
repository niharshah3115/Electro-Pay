import React from 'react';

export function LoadingSkeleton({ count = 3, height = 'h-16', className = '' }) {
  return (
    <div className={`space-y-3 w-full animate-pulse ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`w-full bg-slate-800/60 rounded-xl ${height}`} />
      ))}
    </div>
  );
}
