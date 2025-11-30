/**
 * Button Component - Beyti Design System
 *
 * This component demonstrates how semantic naming works in the design system.
 * Each variant (success, error, danger) maps to specific color tokens.
 *
 * Semantic Mapping:
 * - success: Uses success-btn (background), success-text (text)
 * - error: Uses error-btn (background), error-text (text)
 * - danger: Uses danger-btn (background), danger-text (text)
 * - primary: Uses sage-500 (brand color)
 * - secondary: Uses grey-200 with charcoal-600 text
 *
 * The background color variants (success-bg, error-bg, danger-bg) are used
 * for alert boxes, badges, and other non-button UI elements.
 */

import React from 'react';

const Button = ({
  children,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  disabled = false,
  onClick,
  type = 'button',
  className = '',
  ...props
}) => {
  // Variant styles - mapping semantic status names to design tokens
  const variantStyles = {
    // Success (positive actions like "Approve", "Review")
    success: 'bg-success-btn text-white hover:bg-success-text',

    // Error (destructive actions like "Reject", "Delete")
    error: 'bg-error-btn text-white hover:bg-error-text',

    // Danger/Warning (caution actions like "Archive", "Suspend")
    danger: 'bg-danger-btn text-danger-text hover:bg-danger-text hover:text-white',

    // Primary (brand-colored primary actions)
    primary: 'bg-sage-500 text-white hover:bg-sage-700',

    // Secondary (neutral actions)
    secondary: 'bg-grey-200 text-charcoal-600 border border-grey-stroke hover:bg-cream-100',

    // Ghost (subtle actions)
    ghost: 'bg-transparent text-charcoal-600 hover:bg-cream-100',
  };

  // Size styles
  const sizeStyles = {
    small: 'px-3 py-1.5 text-xs',
    medium: 'px-4 py-2',
    large: 'px-6 py-3 text-base',
  };

  // Combine all styles
  const baseStyles = 'text-button rounded-md transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sage-500 disabled:opacity-50 disabled:cursor-not-allowed';

  const widthStyle = fullWidth ? 'w-full' : '';

  const combinedStyles = `
    ${baseStyles}
    ${variantStyles[variant] || variantStyles.primary}
    ${sizeStyles[size] || sizeStyles.medium}
    ${widthStyle}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <button
      type={type}
      className={combinedStyles}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
