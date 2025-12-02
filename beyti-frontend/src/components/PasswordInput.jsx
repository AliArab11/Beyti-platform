import React, { useState } from 'react';

/**
 * PasswordInput Component
 *
 * A reusable password input field with show/hide toggle functionality.
 * Styled according to the Beyti design system.
 *
 * @param {object} props - Component props
 * @param {string} props.label - Label text for the input (default: "PASSWORD")
 * @param {string} props.value - Input value
 * @param {function} props.onChange - Change handler function
 * @param {string} props.placeholder - Placeholder text (default: "Enter your password")
 * @param {boolean} props.required - Whether the field is required (default: true)
 * @param {string} props.error - Error message to display (optional)
 * @param {string} props.name - Input name attribute (optional)
 * @param {string} props.id - Input id attribute (optional)
 *
 * Usage example:
 * ```jsx
 * <PasswordInput
 *   label="PASSWORD"
 *   value={password}
 *   onChange={(e) => setPassword(e.target.value)}
 *   placeholder="Enter your password"
 *   required
 *   error={errorMessage}
 * />
 * ```
 */
export default function PasswordInput({
  label = "PASSWORD",
  value,
  onChange,
  placeholder = "Enter your password",
  required = true,
  error = null,
  name = "password",
  id = "password"
}) {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-label-medium text-charcoal-600">
        {label}
      </label>
      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={`
            w-full px-4 py-2 pr-12
            bg-cream-100 border
            ${error ? 'border-error-btn' : 'border-charcoal-400'}
            text-body-regular text-charcoal-600
            placeholder:text-charcoal-400
            rounded-md
            focus:outline-none focus:ring-2
            ${error ? 'focus:ring-error-btn' : 'focus:ring-sage-500'}
            transition-all duration-200
          `}
        />
        <button
          type="button"
          onClick={togglePasswordVisibility}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-400 hover:text-charcoal-600 transition-colors duration-200 focus:outline-none"
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
                clipRule="evenodd"
              />
              <path
                d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path
                fillRule="evenodd"
                d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </button>
      </div>
      {error && (
        <p className="text-sm text-error-text" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
