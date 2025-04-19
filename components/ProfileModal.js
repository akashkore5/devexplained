import { useState, useCallback, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { UserIcon, ArrowRightOnRectangleIcon, UserCircleIcon } from "@heroicons/react/24/solid";
import { toast } from "react-hot-toast";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";

const modalVariants = {
  hidden: { opacity: 0, scale: 0.9, y: -20 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } },
  exit: { opacity: 0, scale: 0.9, y: -20, transition: { duration: 0.2 } },
};

const dropdownVariants = {
  hidden: { opacity: 0, height: 0 },
  visible: { opacity: 1, height: "auto", transition: { duration: 0.3, ease: "easeOut" } },
  exit: { opacity: 0, height: 0, transition: { duration: 0.2 } },
};

export default function ProfileModal({ isOpen, onClose, isMobile = false }) {
  const { data: session, status } = useSession();
  const modalRef = useRef(null);
  const [isLogoutLoading, setIsLogoutLoading] = useState(false);

  const handleLogout = useCallback(async () => {
    setIsLogoutLoading(true);
    try {
      await signOut({ redirect: false });
      toast.success("Logged out successfully");
      onClose();
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to log out");
    } finally {
      setIsLogoutLoading(false);
    }
  }, [onClose]);

  // Focus trapping and close on Escape or outside click (desktop only)
  useEffect(() => {
    if (!isMobile && isOpen) {
      const handleKeyDown = (e) => {
        if (e.key === "Escape") onClose();
      };

      const handleClickOutside = (e) => {
        if (modalRef.current && !modalRef.current.contains(e.target)) onClose();
      };

      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements?.[0];
      const lastElement = focusableElements?.[focusableElements.length - 1];

      const trapFocus = (e) => {
        if (e.key === "Tab") {
          if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      };

      document.addEventListener("keydown", handleKeyDown);
      document.addEventListener("keydown", trapFocus);
      document.addEventListener("mousedown", handleClickOutside);
      firstElement?.focus();

      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        document.removeEventListener("keydown", trapFocus);
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen, isMobile, onClose]);

  if (status !== "authenticated") return null;

  const content = (
    <div className="p-6 space-y-6">
      <div className="flex items-center space-x-4">
        <UserCircleIcon className="w-12 h-12 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
        <div>
          <p className="text-base font-semibold text-gray-900 dark:text-white truncate">
            {session?.user?.name || "User"}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
            {session?.user?.email || "No email provided"}
          </p>
        </div>
      </div>
      <Link
        href="/profile"
        className="flex items-center space-x-2 w-full py-3 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 transition-colors duration-200 text-sm font-medium"
        onClick={onClose}
        aria-label="View full profile"
      >
        <UserIcon className="w-5 h-5" />
        <span>View Profile</span>
      </Link>
      <button
        onClick={handleLogout}
        disabled={isLogoutLoading}
        className="flex items-center space-x-2 w-full py-3 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 transition-colors duration-200 text-sm font-medium disabled:opacity-50"
        aria-label="Sign out"
      >
        <ArrowRightOnRectangleIcon className="w-5 h-5" />
        <span>{isLogoutLoading ? "Signing out..." : "Sign Out"}</span>
      </button>
    </div>
  );

  return isMobile ? (
    <motion.div
      variants={dropdownVariants}
      initial="hidden"
      animate={isOpen ? "visible" : "hidden"}
      exit="exit"
      className="bg-white dark:bg-slate-900 border-t border-gray-200/50 dark:border-slate-700/50 overflow-hidden"
    >
      {content}
    </motion.div>
  ) : (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: isOpen ? 1 : 0 }}
      exit={{ opacity: 0 }}
      className={`fixed inset-0 z-50 flex items-start justify-end p-4 ${isOpen ? "" : "pointer-events-none"}`}
    >
      <motion.div
        ref={modalRef}
        variants={modalVariants}
        initial="hidden"
        animate={isOpen ? "visible" : "hidden"}
        exit="exit"
        className="bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-700 rounded-xl shadow-2xl w-full max-w-sm border border-gray-200/50 dark:border-slate-700/50 overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-modal-title"
      >
        <h2 id="profile-modal-title" className="sr-only">
          User Profile
        </h2>
        {content}
      </motion.div>
    </motion.div>
  );
}