/**
 * Analytics Card Component
 *
 * A flexible card component for displaying analytics metrics.
 *
 * Specifications:
 * - Container: bg-grey-200, shadow-soft-lift
 * - Number: text-metric-h3 (Merriweather 36px), text-charcoal-600
 * - Label: text-body-regular (Inter 16px), text-charcoal-400
 * - Padding: p-6
 * - Border radius: rounded-lg
 *
 * Supports:
 * - Single metric with optional description
 * - Multiple metrics (split layout)
 * - Custom title
 */

import React from 'react';

const AnalyticsCard = ({
  title,
  metrics = [],
  description,
  className = '',
  ...props
}) => {
  // Base card styles
  const cardStyles = `
    bg-grey-200
    dark:bg-[#2A2A2A]
    shadow-soft-lift
    dark:shadow-none
    rounded-lg
    p-6
    border
    border-transparent
    dark:border-charcoal-500
    transition-colors
    ${className}
  `.trim().replace(/\s+/g, ' ');

  // Single metric layout
  if (metrics.length === 1) {
    const metric = metrics[0];
    return (
      <div className={cardStyles} {...props}>
        {title && (
          <h3 className="text-card-h2 text-charcoal-600 dark:text-white mb-4">
            {title}
          </h3>
        )}
        <p className="text-metric-h3 text-charcoal-600 dark:text-white">
          {metric.value}
        </p>
        {(metric.label || description) && (
          <p className="text-body-regular text-charcoal-400 dark:text-gray-400 mt-2">
            {metric.label || description}
          </p>
        )}
      </div>
    );
  }

  // Multiple metrics layout (side by side)
  if (metrics.length > 1) {
    return (
      <div className={cardStyles} {...props}>
        {title && (
          <h3 className="text-card-h2 text-charcoal-600 dark:text-white mb-4">
            {title}
          </h3>
        )}
        <div className="flex gap-8">
          {metrics.map((metric, index) => (
            <div key={index} className="flex-1">
              <p className="text-metric-h3 text-charcoal-600 dark:text-white">
                {metric.value}
              </p>
              {metric.label && (
                <p className="text-body-regular text-charcoal-400 dark:text-gray-400 mt-2">
                  {metric.label}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  return (
    <div className={cardStyles} {...props}>
      {title && (
        <h3 className="text-card-h2 text-charcoal-600 dark:text-white mb-4">
          {title}
        </h3>
      )}
      <p className="text-metric-h3 text-charcoal-600 dark:text-white">0</p>
      {description && (
        <p className="text-body-regular text-charcoal-400 dark:text-gray-400 mt-2">
          {description}
        </p>
      )}
    </div>
  );
};

export default AnalyticsCard;
