
import React, { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  actionButton?: ReactNode;
}

const Card: React.FC<CardProps> = ({ children, className = '', title, actionButton }) => {
  return (
    <div className={`bg-[var(--bg-card)] backdrop-blur-xl rounded-2xl shadow-xl border border-[var(--border-color)] p-6 ${className}`}>
      {title && (
        <div className="flex justify-between items-center mb-4 border-b border-[var(--border-color-light)] pb-2">
            <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-fuchsia-500">{title}</h2>
            {actionButton}
        </div>
      )}
      {!title && <h2 className="text-xl font-bold mb-4 border-b border-[var(--border-color-light)] pb-2 bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-fuchsia-500"> </h2>}
      {children}
    </div>
  );
};

export default Card;
