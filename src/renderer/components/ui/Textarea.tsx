import React from 'react';

export const Textarea = ({
  label,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) => (
  <div className="w-full">
    {label && (
      <label className="block text-sm font-medium text-brand-text-secondary mb-1">
        {label}
      </label>
    )}
    <textarea
      {...props}
      className={`w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-brand-text placeholder-brand-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-primary ${props.className ?? ''}`}
    />
  </div>
);
