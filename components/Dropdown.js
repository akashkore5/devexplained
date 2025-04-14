import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PropTypes from "prop-types";

/**
 * A production-ready dropdown component with smooth animations, accessibility, and customization.
 * @param {Object} props
 * @param {Array<string|Object>} props.options - Array of options (strings or objects with value/label).
 * @param {string} props.value - Selected value.
 * @param {(value: string) => void} props.onChange - Callback for value changes.
 * @param {string} [props.label="Select an option"] - Accessibility label.
 * @param {string} [props.placeholder="Select..."] - Placeholder when no value is selected.
 * @param {string} [props.className=""] - Container classes.
 * @param {string} [props.buttonClassName=""] - Button classes.
 * @param {string} [props.menuClassName=""] - Menu classes.
 * @param {number} [props.maxDisplayLength=40] - Max chars before truncation.
 * @param {boolean} [props.disabled=false] - Disable the dropdown.
 * @param {boolean} [props.loading=false] - Show loading state.
 * @param {boolean} [props.clearable=false] - Allow clearing the value.
 * @param {string} [props.size="md"] - Size variant (sm, md, lg).
 * @param {string} [props.placement="bottom"] - Menu placement (top, bottom).
 */
export default function Dropdown({
  options = [],
  value = "",
  onChange,
  label = "Select an option",
  placeholder = "Select...",
  className = "",
  buttonClassName = "",
  menuClassName = "",
  maxDisplayLength = 40,
  disabled = false,
  loading = false,
  clearable = false,
  size = "md",
  placement = "bottom",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  // Normalize options to handle strings or objects
  const normalizedOptions = useMemo(() => {
    const uniqueOptions = Array.from(new Set(options.map(opt => JSON.stringify(opt))))
      .map(str => JSON.parse(str));
    return uniqueOptions.map((opt) =>
      typeof opt === "string" ? { value: opt, label: opt } : { value: opt.value, label: opt.label }
    );
  }, [options]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Respect reduced motion preference
  const prefersReducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Animation variants
  const menuVariants = {
    open: {
      opacity: 1,
      y: placement === "top" ? -10 : 10,
      scale: 1,
      transition: prefersReducedMotion ? {} : { type: "spring", stiffness: 300, damping: 25 },
    },
    closed: {
      opacity: 0,
      y: placement === "top" ? 10 : -10,
      scale: 0.95,
      transition: prefersReducedMotion ? {} : { duration: 0.2 },
    },
  };

  const itemVariants = {
    open: { opacity: 1, y: 0, transition: prefersReducedMotion ? {} : { duration: 0.2 } },
    closed: { opacity: 0, y: -5, transition: prefersReducedMotion ? {} : { duration: 0.1 } },
  };

  // Handlers
  const handleSelect = useCallback(
    (optionValue) => {
      onChange(optionValue);
      setIsOpen(false);
      setFocusedIndex(-1);
      buttonRef.current?.focus();
    },
    [onChange]
  );

  const handleClear = useCallback(
    (e) => {
      e.stopPropagation();
      // Reset to "All" if options include it, else ""
      const resetValue = normalizedOptions.some(opt => opt.value === "All") ? "All" : "";
      onChange(resetValue);
      setIsOpen(false);
      setFocusedIndex(-1);
    },
    [onChange, normalizedOptions]
  );

  const handleKeyDown = useCallback(
    (e) => {
      if (disabled || loading) return;

      if (!isOpen) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setIsOpen(true);
        }
        return;
      }

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setFocusedIndex((prev) => Math.min(prev + 1, normalizedOptions.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setFocusedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < normalizedOptions.length) {
            handleSelect(normalizedOptions[focusedIndex].value);
          }
          break;
        case "Escape":
          e.preventDefault();
          setIsOpen(false);
          setFocusedIndex(-1);
          buttonRef.current?.focus();
          break;
        default:
          break;
      }
    },
    [isOpen, normalizedOptions, focusedIndex, handleSelect, disabled, loading]
  );

  // Display value
  const displayValue = useMemo(() => {
    if (loading) return "Loading...";
    const selectedOption = normalizedOptions.find((opt) => opt.value === value);
    const label = selectedOption ? selectedOption.label : placeholder;
    return label.length > maxDisplayLength ? `${label.slice(0, maxDisplayLength - 3)}...` : label;
  }, [value, normalizedOptions, placeholder, maxDisplayLength, loading]);

  // Size classes
  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-3 text-base",
  };

  // Menu positioning
  const placementClasses = placement === "top" ? "bottom-full mb-1" : "top-full mt-1";

  return (
    <div
      className={`relative ${className}`}
      ref={dropdownRef}
      onKeyDown={handleKeyDown}
      aria-busy={loading}
    >
      <button
        ref={buttonRef}
        onClick={() => !disabled && !loading && setIsOpen(!isOpen)}
        className={`
          flex items-center justify-between w-full ${sizeClasses[size]} bg-white dark:bg-slate-800 
          border border-gray-300 dark:border-slate-600 rounded-full text-gray-900 dark:text-gray-100 
          hover:bg-gray-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 
          transition duration-150 ease-in-out shadow-sm
          ${disabled || loading ? "opacity-50 cursor-not-allowed" : "hover:shadow-md active:scale-95"}
          ${buttonClassName}
        `}
        aria-label={label}
        aria-expanded={isOpen}
        aria-controls={isOpen ? `dropdown-menu-${label.replace(/\s+/g, "-").toLowerCase()}` : undefined}
        role="combobox"
        disabled={disabled || loading}
      >
        <span className="whitespace-nowrap truncate">{displayValue}</span>
        <div className="flex items-center ml-2 space-x-2">
          {clearable && value && !loading && (
            <button
              onClick={handleClear}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none"
              aria-label="Clear selection"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          {loading ? (
            <svg className="w-4 h-4 animate-spin text-indigo-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.ul
            variants={menuVariants}
            initial="closed"
            animate="open"
            exit="closed"
            id={`dropdown-menu-${label.replace(/\s+/g, "-").toLowerCase()}`}
            className={`
              absolute z-20 w-full ${placementClasses} bg-white dark:bg-slate-800 
              border border-gray-300 dark:border-slate-600 rounded-lg shadow-xl 
              max-h-60 overflow-y-auto focus:outline-none
              ${menuClassName}
            `}
            role="listbox"
            aria-label={label}
          >
            {normalizedOptions.length === 0 ? (
              <li className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 italic">
                {loading ? "Loading options..." : "No options available"}
              </li>
            ) : (
              normalizedOptions.map((option, index) => (
                <motion.li
                  key={option.value}
                  variants={itemVariants}
                  onClick={() => handleSelect(option.value)}
                  className={`
                    px-4 py-2 text-sm text-gray-900 dark:text-gray-100 
                    hover:bg-indigo-50 dark:hover:bg-slate-700 cursor-pointer 
                    transition duration-100 ease-in-out
                    ${value === option.value ? "bg-indigo-100 dark:bg-slate-600 font-medium" : ""}
                    ${focusedIndex === index ? "ring-1 ring-indigo-500 dark:ring-indigo-400" : ""}
                    ${option.label.length > maxDisplayLength ? "truncate" : ""}
                  `}
                  role="option"
                  aria-selected={value === option.value}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleSelect(option.value);
                    }
                  }}
                >
                  {option.label}
                </motion.li>
              ))
            )}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

Dropdown.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        value: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
      }),
    ])
  ),
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string,
  placeholder: PropTypes.string,
  className: PropTypes.string,
  buttonClassName: PropTypes.string,
  menuClassName: PropTypes.string,
  maxDisplayLength: PropTypes.number,
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  clearable: PropTypes.bool,
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  placement: PropTypes.oneOf(["top", "bottom"]),
};