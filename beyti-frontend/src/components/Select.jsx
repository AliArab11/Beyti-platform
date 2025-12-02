import React from 'react';

/**
 * Select Component
 *
 * A reusable dropdown/select component styled according to the Beyti design system.
 * Uses native select element for accessibility and mobile compatibility.
 *
 * @param {object} props - Component props
 * @param {string} props.label - Label text for the select
 * @param {string} props.value - Selected value
 * @param {function} props.onChange - Change handler function
 * @param {Array} props.options - Array of options [{value, label}]
 * @param {string} props.placeholder - Placeholder text
 * @param {string} props.error - Error message to display
 * @param {boolean} props.required - Whether the field is required
 * @param {boolean} props.disabled - Whether the select is disabled
 * @param {string} props.name - Select name attribute
 * @param {string} props.id - Select id attribute
 *
 * Usage example:
 * ```jsx
 * <Select
 *   label="CITY"
 *   value={city}
 *   onChange={(e) => setCity(e.target.value)}
 *   options={[
 *     { value: 'manama', label: 'Manama' },
 *     { value: 'muharraq', label: 'Muharraq' }
 *   ]}
 *   placeholder="Select a city"
 *   required
 * />
 * ```
 */
export default function Select({
  label,
  value,
  onChange,
  options = [],
  placeholder = "Select...",
  error = null,
  required = false,
  disabled = false,
  name,
  id
}) {
  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={id} className="text-label-medium text-charcoal-600">
          {label}
        </label>
      )}
      <select
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className={`
          w-full px-4 py-2
          bg-cream-100 border
          ${error ? 'border-error-btn' : 'border-charcoal-400'}
          text-body-regular
          ${value ? 'text-charcoal-600' : 'text-charcoal-400'}
          rounded-md
          focus:outline-none focus:ring-2
          ${error ? 'focus:ring-error-btn' : 'focus:ring-sage-500'}
          transition-all duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
          appearance-none
          cursor-pointer
        `}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%238B8A88'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 0.5rem center',
          backgroundSize: '1.5em 1.5em',
          paddingRight: '2.5rem'
        }}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-sm text-error-text" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
