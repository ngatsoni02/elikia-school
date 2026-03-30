import React, { ReactNode } from 'react';

export const Select = ({
  label,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string; children: ReactNode }) => (
  <div className="w-full">
    {label && (
      <label className="block text-sm font-medium text-brand-text-secondary mb-1">
        {label}
      </label>
    )}
    <select
      {...props}
      className={`w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-brand-text placeholder-brand-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-primary ${props.className ?? ''}`}
    >
      {children}
    </select>
  </div>
);
