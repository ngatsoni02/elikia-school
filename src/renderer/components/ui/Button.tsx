import React, { PropsWithChildren } from 'react';

type ButtonVariant = 'primary' | 'danger' | 'secondary';
type ButtonSize = 'sm' | 'md';

interface ButtonProps {
  onClick?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-brand-primary hover:bg-brand-primary-hover text-white shadow-md hover:shadow-lg focus:ring-brand-primary',
  danger: 'bg-brand-danger hover:bg-red-700 text-white focus:ring-brand-danger',
  secondary: 'bg-brand-surface hover:bg-brand-border text-brand-text focus:ring-brand-border',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-2 py-1 text-sm',
  md: 'px-4 py-2',
};

export const Button = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button',
  disabled = false,
}: PropsWithChildren<ButtonProps>) => {
  const base = 'rounded-lg font-semibold transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-bg';
  return (
    <button
      type={type}
      onClick={onClick}
      className={`${base} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      disabled={disabled}
    >
      {children}
    </button>
  );
};
