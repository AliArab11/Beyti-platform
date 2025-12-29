/**
 * Card Checklist Component
 *
 * Card component for displaying checklists with completed and pending items.
 *
 * Specifications:
 * - Container: bg-grey-200, shadow-soft-lift, rounded-lg
 * - Divider: Horizontal rule border-grey-stroke below title
 * - Padding: p-6
 * - Title: text-card-h2 (Merriweather 20px)
 * - Subheading: text-light-h3 (Merriweather 18px)
 * - Body Content: text-body-regular (Inter 16px)
 * - Icons: Completed (Checkmark fill sage-500), Pending (Circle stroke sage-500)
 */

import React from 'react';
import { CheckCircle, Circle } from '@phosphor-icons/react';

const CardChecklist = ({
  title,
  subheading,
  items = [],
  className = '',
  ...props
}) => {
  return (
    <div className={`bg-grey-200 dark:bg-[#2A2A2A] shadow-soft-lift dark:shadow-none rounded-lg p-6 border border-transparent dark:border-charcoal-500 transition-colors ${className}`} {...props}>
      {/* Title */}
      {title && (
        <>
          <h2 className="text-card-h2 text-charcoal-600 dark:text-white mb-2">{title}</h2>
          <div className="border-b border-grey-stroke dark:border-charcoal-500 mb-4"></div>
        </>
      )}

      {/* Subheading */}
      {subheading && (
        <h3 className="text-light-h3 text-charcoal-600 dark:text-gray-100 mb-3">{subheading}</h3>
      )}

      {/* Checklist Items */}
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-3">
            {/* Icon */}
            {item.completed ? (
              <CheckCircle size={20} weight="fill" className="text-sage-500 dark:text-sage-500 flex-shrink-0" />
            ) : (
              <Circle size={20} weight="regular" className="text-sage-500 dark:text-sage-500 flex-shrink-0" />
            )}

            {/* Text */}
            <span className="text-body-regular text-charcoal-600 dark:text-gray-200">
              {item.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CardChecklist;
