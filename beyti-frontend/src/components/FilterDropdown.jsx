/**
 * Filter Dropdown Component
 *
 * Dropdown selector for filtering data with label and value display.
 *
 * Specifications:
 * - Dimensions: ~140w x 42h (Matches CRUD Button height)
 * - Typography: text-body-regular (Inter 16px)
 * - Label ("Filter:"): text-charcoal-400
 * - Value ("All"): text-charcoal-600
 * - Radius: rounded-md
 * - Icon: Chevron Down, stroke-charcoal-400
 *
 * Variants:
 * - Default: bg-transparent, border-charcoal-400
 * - Active/Filled: bg-cream-100, border-charcoal-400
 */

import React, { useState } from 'react';
import { CaretDown } from '@phosphor-icons/react';

const FilterDropdown = ({
  label = 'Filter:',
  value = 'All',
  options = ['All'],
  onChange,
  className = '',
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value);

  const handleSelect = (option) => {
    setSelectedValue(option);
    setIsOpen(false);
    if (onChange) {
      onChange(option);
    }
  };

  // Variant styles based on filled state
  const variantStyles =
    selectedValue && selectedValue !== 'All'
      ? 'bg-cream-100 border-charcoal-400 dark:bg-charcoal-400 dark:border-charcoal-500'
      : 'bg-transparent border-charcoal-400 dark:border-charcoal-500';

  // Base styles
  const baseStyles = `
    relative
    w-[140px]
    h-[42px]
    border
    rounded-md
    px-3
    flex
    items-center
    justify-between
    gap-2
    cursor-pointer
    transition-all
    duration-200
    hover:bg-cream-50
    dark:hover:bg-charcoal-400
  `.trim().replace(/\s+/g, ' ');

  const combinedStyles = `
    ${baseStyles}
    ${variantStyles}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <div className="relative inline-block">
      <div
        className={combinedStyles}
        onClick={() => setIsOpen(!isOpen)}
        {...props}
      >
        <div className="flex items-center gap-1 text-body-regular">
          <span className="text-charcoal-400 dark:text-gray-400">{label}</span>
          <span className="text-charcoal-600 dark:text-white font-medium">{selectedValue}</span>
        </div>
        <CaretDown size={16} className="text-charcoal-400 dark:text-gray-400 flex-shrink-0" />
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Options */}
          <div className="absolute top-full left-0 mt-1 w-full bg-grey-200 dark:bg-[#2A2A2A] border border-grey-stroke dark:border-charcoal-500 rounded-md shadow-soft-lift dark:shadow-none z-20 overflow-hidden">
            {options.map((option, index) => (
              <div
                key={index}
                className={`
                  px-3 py-2 text-body-regular cursor-pointer transition-colors
                  ${selectedValue === option
                    ? 'bg-cream-100 dark:bg-charcoal-400 text-charcoal-600 dark:text-white font-medium'
                    : 'text-charcoal-600 dark:text-gray-200 hover:bg-cream-50 dark:hover:bg-charcoal-500'
                  }
                `}
                onClick={() => handleSelect(option)}
              >
                {option}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default FilterDropdown;
