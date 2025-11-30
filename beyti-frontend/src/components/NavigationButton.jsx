/**
 * Navigation Button Component
 *
 * A button component for sidebar/navigation with selected and default states.
 *
 * Specifications:
 * - Dimensions: 220w x 44h
 * - Typography: text-body-medium (Inter 18px)
 * - Radius: rounded-md
 *
 * Variants:
 * - selected: bg-sage-700, text-cream-200
 * - default: no bg, text-cream-200
 */

import React from 'react';

const NavigationButton = ({
  children,
  icon,
  selected = false,
  onClick,
  disabled = false,
  className = '',
  ...props
}) => {
  // Variant styles based on selected state
  const variantStyles = selected
    ? 'bg-sage-700 text-cream-200'
    : 'text-cream-200 hover:bg-sage-700/50';

  // Base styles - fixed width 220px, height 44px
  const baseStyles = `
    w-[220px]
    h-[44px]
    text-body-medium
    rounded-md
    transition-all
    duration-200
    cursor-pointer
    flex
    items-center
    gap-3
    px-4
    focus:outline-none
    focus:ring-2
    focus:ring-offset-2
    focus:ring-cream-200
    disabled:opacity-50
    disabled:cursor-not-allowed
  `.trim().replace(/\s+/g, ' ');

  const combinedStyles = `
    ${baseStyles}
    ${variantStyles}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <button
      type="button"
      className={combinedStyles}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  );
};

export default NavigationButton;
