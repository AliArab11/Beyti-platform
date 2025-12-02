import React from 'react';

/**
 * Input Component
 *
 * A reusable input field component styled according to the Beyti design system.
 * Matches PasswordInput styling for consistency.
 *
 * @param {object} props - Component props
 * @param {string} props.type - Input type (text, email, tel, number)
 * @param {string} props.label - Label text for the input
 * @param {string} props.value - Input value
 * @param {function} props.onChange - Change handler function
 * @param {string} props.placeholder - Placeholder text
 * @param {boolean} props.required - Whether the field is required
 * @param {string} props.error - Error message to display
 * @param {string} props.name - Input name attribute
 * @param {string} props.id - Input id attribute
 * @param {boolean} props.disabled - Whether the input is disabled
 *
 * Usage example:
 * ```jsx
 * <Input
 *   type="email"
 *   label="EMAIL ADDRESS"
 *   value={email}
 *   onChange={(e) => setEmail(e.target.value)}
 *   placeholder="Enter your email"
 *   required
 *   error={emailError}
 * />
 * ```
 */
export default function Input({
  type = "text",
  label,
  value,
  onChange,
  placeholder,
  required = false,
  error = null,
  name,
  id,
  disabled = false
}) {
  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={id} className="text-label-medium text-charcoal-600">
          {label}
        </label>
      )}
      <input
        type={type}
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={`
          w-full px-4 py-2
          bg-cream-100 border
          ${error ? 'border-error-btn' : 'border-charcoal-400'}
          text-body-regular text-charcoal-600
          placeholder:text-charcoal-400
          rounded-md
          focus:outline-none focus:ring-2
          ${error ? 'focus:ring-error-btn' : 'focus:ring-sage-500'}
          transition-all duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
      />
      {error && (
        <p className="text-sm text-error-text" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
