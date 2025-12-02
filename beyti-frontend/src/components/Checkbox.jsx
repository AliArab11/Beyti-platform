import React from 'react';

/**
 * Checkbox Component
 *
 * A reusable checkbox component styled according to the Beyti design system.
 * Commonly used for Terms & Conditions acceptance.
 *
 * @param {object} props - Component props
 * @param {string} props.label - Label text for the checkbox (can include JSX)
 * @param {boolean} props.checked - Whether the checkbox is checked
 * @param {function} props.onChange - Change handler function
 * @param {string} props.error - Error message to display
 * @param {boolean} props.required - Whether the checkbox is required
 * @param {string} props.name - Checkbox name attribute
 * @param {string} props.id - Checkbox id attribute
 *
 * Usage example:
 * ```jsx
 * <Checkbox
 *   label={<span>I agree to the <a href="/terms">Terms & Conditions</a></span>}
 *   checked={agreed}
 *   onChange={(e) => setAgreed(e.target.checked)}
 *   required
 *   error={agreedError}
 * />
 * ```
 */
export default function Checkbox({
  label,
  checked,
  onChange,
  error = null,
  required = false,
  name,
  id
}) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className="flex items-start gap-3 cursor-pointer group"
      >
        <div className="relative flex items-center justify-center">
          <input
            type="checkbox"
            id={id}
            name={name}
            checked={checked}
            onChange={onChange}
            required={required}
            className="
              w-5 h-5
              rounded
              border-2
              border-charcoal-400
              bg-cream-100
              checked:bg-sage-500
              checked:border-sage-500
              focus:outline-none
              focus:ring-2
              focus:ring-sage-500
              focus:ring-offset-2
              transition-all
              duration-200
              cursor-pointer
            "
          />
          {checked && (
            <svg
              className="absolute w-3 h-3 text-white pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
        </div>
        <span className="text-body-regular text-charcoal-600 select-none">
          {label}
        </span>
      </label>
      {error && (
        <p className="text-sm text-error-text ml-8" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
