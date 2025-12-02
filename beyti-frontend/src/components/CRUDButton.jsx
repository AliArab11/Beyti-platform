/**
 * CRUD Button Component
 *
 * A button component specifically designed for CRUD operations with semantic variants.
 *
 * Specifications:
 * - Dimensions: 150w x 42h
 * - Typography: text-button (Inter 16px)
 * - Radius: rounded-md
 *
 * Variants:
 * - success: Green button for positive actions (Accept, Approve)
 * - error: Red button for negative actions (Reject, Delete)
 * - danger: Orange/yellow button for warning actions (Pending, Archive)
 * - neutral: Light button for neutral actions (View, Details)
 * - outline: Border-only button for secondary actions
 */

import React from 'react';

const CRUDButton = ({
  children,
  variant = 'neutral',
  onClick,
  disabled = false,
  type = 'button',
  className = '',
  ...props
}) => {
  // Variant styles based on specifications
  const variantStyles = {
    // Success: bg-success-btn, text-sage-100
    success: 'bg-success-btn text-sage-100 hover:bg-success-text dark:bg-success-btn dark:text-sage-100 dark:hover:bg-success-text',

    // Error: bg-error-btn, text-sage-100
    error: 'bg-error-btn text-sage-100 hover:bg-error-text dark:bg-error-btn dark:text-sage-100 dark:hover:bg-error-text',

    // Danger: bg-danger-btn, text-charcoal-600
    danger: 'bg-danger-btn text-charcoal-600 hover:bg-danger-text dark:bg-danger-btn dark:text-white dark:hover:bg-danger-text',

    // Neutral: bg-cream-100, text-charcoal-600
    neutral: 'bg-cream-100 text-charcoal-600 hover:bg-cream-200 dark:bg-charcoal-400 dark:text-cream-50 dark:hover:bg-charcoal-500',

    // Outline: no bg, text-charcoal-600, stroke-charcoal-400
    outline: 'bg-transparent text-charcoal-600 border-2 border-charcoal-400 hover:bg-cream-50 dark:text-cream-50 dark:border-charcoal-500 dark:hover:bg-charcoal-400',
  };

  // Base styles - fixed width 150px, height 42px
  const baseStyles = `
    w-[150px]
    h-[42px]
    text-button
    rounded-md
    transition-all
    duration-200
    cursor-pointer
    focus:outline-none
    focus:ring-2
    focus:ring-offset-2
    focus:ring-sage-500
    disabled:opacity-50
    disabled:cursor-not-allowed
  `.trim().replace(/\s+/g, ' ');

  const combinedStyles = `
    ${baseStyles}
    ${variantStyles[variant] || variantStyles.neutral}
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

export default CRUDButton;
