import React, { PropsWithChildren } from 'react';

export const Card = ({ children, className = '' }: PropsWithChildren<{ className?: string }>) => (
  <div
    className={`bg-gradient-to-br from-brand-surface to-[#232a34] border border-brand-border rounded-xl p-4 md:p-6 ${className}`}
  >
    {children}
  </div>
);
