/**
 * Status Chip Component
 *
 * Pill-shaped status indicators for roles and statuses.
 *
 * Specifications:
 * - Dimensions: Hug contents (width), 36px (height)
 * - Typography: text-body-regular (Inter 16px)
 * - Radius: rounded-full (Pill shape)
 *
 * Variants:
 * - brand (Role): bg-sage-500, text-sage-100
 * - success (Active): bg-success-bg, text-sage-700
 * - error (Suspended): bg-error-bg, text-error-text
 * - danger (Pending): bg-danger-bg, text-danger-text
 * - neutral (Inactive): bg-grey-stroke, text-charcoal-400
 */

import React from 'react';

const StatusChip = ({
  children,
  variant = 'neutral',
  className = '',
  ...props
}) => {
  // Variant styles based on specifications
  const variantStyles = {
    // Brand (Role): bg-sage-500, text-sage-100
    brand: 'bg-sage-500 text-sage-100',

    // Success (Active): bg-success-bg, text-sage-700
    success: 'bg-success-bg text-sage-700',

    // Error (Suspended): bg-error-bg, text-error-text
    error: 'bg-error-bg text-error-text',

    // Danger (Pending): bg-danger-bg, text-danger-text
    danger: 'bg-danger-bg text-danger-text',

    // Neutral (Inactive): bg-grey-stroke, text-charcoal-400
    neutral: 'bg-grey-stroke text-charcoal-400',
  };

  // Base styles - pill shape, hug contents
  const baseStyles = `
    inline-flex
    items-center
    justify-center
    h-[36px]
    px-4
    text-body-regular
    rounded-full
    whitespace-nowrap
  `.trim().replace(/\s+/g, ' ');

  const combinedStyles = `
    ${baseStyles}
    ${variantStyles[variant] || variantStyles.neutral}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <span className={combinedStyles} {...props}>
      {children}
    </span>
  );
};

export default StatusChip;
