import React from 'react';

interface LoadingSpinnerProps {
  color?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  color = 'tg-green',
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className="flex items-center justify-center py-12">
      <div className={`${sizeClasses[size]} border-2 border-${color} border-t-transparent rounded-full animate-spin`} />
    </div>
  );
};
