import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Dropdown({ options, value, onChange, label, className }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Animation variants
  const menuVariants = {
    open: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.2 },
    },
    closed: {
      opacity: 0,
      y: -10,
      transition: { duration: 0.2 },
    },
  };

  // Truncate only if value is too long (>40 chars)
  const displayValue = value.length > 40 ? `${value.slice(0, 37)}...` : value;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-4 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-full text-gray-700 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition text-sm"
        aria-label={label}
        aria-expanded={isOpen}
      >
        <span className="whitespace-nowrap">{displayValue}</span>
        <svg
          className={`w-4 h-4 ml-2 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.ul
            variants={menuVariants}
            initial="closed"
            animate="open"
            exit="closed"
            className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg shadow-lg max-h-60 overflow-y-auto"
            role="listbox"
            aria-label={label}
          >
            {options.map((option) => (
              <li
                key={option}
                onClick={() => {
                  onChange(option);
                  setIsOpen(false);
                }}
                className={`px-4 py-2 text-sm text-gray-700 dark:text-gray-100 hover:bg-indigo-50 dark:hover:bg-slate-600 cursor-pointer transition whitespace-nowrap ${
                  value === option ? "bg-indigo-100 dark:bg-slate-600 font-medium" : ""
                } ${option.length > 40 ? "truncate" : ""}`}
                role="option"
                aria-selected={value === option}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    onChange(option);
                    setIsOpen(false);
                  }
                }}
              >
                {option}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}