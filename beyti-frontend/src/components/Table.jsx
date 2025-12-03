/**
 * Table Component
 *
 * Complete table system with header, rows, and container.
 *
 * Components:
 * - Table: Main container with title, filters, and action button
 * - TableHeader: Column headers
 * - TableRow: Data rows with action buttons
 */

import React from 'react';
import CRUDButton from './CRUDButton';
import FilterDropdown from './FilterDropdown';

/**
 * Table Container
 *
 * Specifications:
 * - Background: bg-grey-200
 * - Shadow: shadow-soft-lift
 * - Border Radius: rounded-lg
 * - Header Layout: Flex (justify-between)
 * - Padding: p-6
 * - Title Typography: text-display-h2 (Merriweather 24px), text-charcoal-600
 */
export const Table = ({
  title,
  children,
  filters = [],
  actionButton,
  className = '',
  ...props
}) => {
  return (
    <div className={`bg-grey-200 dark:bg-[#2A2A2A] shadow-soft-lift dark:shadow-none rounded-lg border border-transparent dark:border-charcoal-500 transition-colors ${className}`} {...props}>
      {/* Header with title, filters, and action */}
      {(title || filters.length > 0 || actionButton) && (
        <div className="flex items-center justify-between p-6 border-b border-grey-stroke dark:border-charcoal-500">
          <h2 className="text-display-h2 text-charcoal-600 dark:text-white">{title}</h2>

          <div className="flex items-center gap-3">
            {/* Filters */}
            {filters.map((filter, index) => (
              <FilterDropdown
                key={index}
                label={filter.label}
                value={filter.value}
                options={filter.options}
                onChange={filter.onChange}
              />
            ))}

            {/* Action Button */}
            {actionButton}
          </div>
        </div>
      )}

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full">
          {children}
        </table>
      </div>
    </div>
  );
};

/**
 * Table Header
 *
 * Specifications:
 * - Background: bg-cream-100
 * - Border: Bottom border border-grey-stroke (1px solid)
 * - Typography: text-light-h3 (Merriweather 18px)
 * - Color: text-charcoal-600
 * - Height: ~48px - 56px
 * - Padding: px-6
 */
export const TableHeader = ({ columns = [], className = '', ...props }) => {
  return (
    <thead className={`bg-cream-100 dark:bg-charcoal-500 border-b border-grey-stroke dark:border-charcoal-500 ${className}`} {...props}>
      <tr>
        {columns.map((column, index) => (
          <th
            key={index}
            className="px-6 py-3 text-left text-light-h3 text-charcoal-600 dark:text-gray-200 font-light"
          >
            {column}
          </th>
        ))}
      </tr>
    </thead>
  );
};

/**
 * Table Row
 *
 * Specifications:
 * - Background: bg-grey-200
 * - Divider: Bottom border 1px solid border-grey-stroke
 * - Typography (Data): text-body-regular (Inter 16px), text-charcoal-600
 * - Height: ~72px (accommodating 42px buttons + padding)
 * - Padding: Vertical py-4, Horizontal px-6
 */
export const TableRow = ({ data = [], actions, className = '', ...props }) => {
  return (
    <tr className={`bg-grey-200 dark:bg-[#2A2A2A] border-b border-grey-stroke dark:border-charcoal-500 hover:bg-cream-50 dark:hover:bg-charcoal-500 transition-colors ${className}`} {...props}>
      {data.map((cell, index) => (
        <td key={index} className="px-6 py-4 text-body-regular text-charcoal-600 dark:text-gray-200">
          {cell}
        </td>
      ))}

      {/* Actions Column */}
      {actions && (
        <td className="px-6 py-4">
          <div className="flex items-center gap-2">
            {actions}
          </div>
        </td>
      )}
    </tr>
  );
};

/**
 * Table Body
 */
export const TableBody = ({ children, className = '', ...props }) => {
  return (
    <tbody className={className} {...props}>
      {children}
    </tbody>
  );
};

export default Table;
