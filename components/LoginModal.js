import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import { signIn } from "next-auth/react";
import { XMarkIcon } from "@heroicons/react/24/solid";

export default function LoginModal({ isOpen, onClose, initialMode = "signin", onLoginSuccess }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState(initialMode);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (mode === "register") {
      if (!name || !/^[a-zA-Z\s]{2,50}$/.test(name)) {
        newErrors.name = "Name must be 2–50 alphabetic characters";
      }
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Invalid email address";
    }
    if (mobile && !/^\+?[\d-]{7,15}$/.test(mobile)) {
      newErrors.mobile = "Invalid mobile number (e.g., +1234567890 or 123-456-7890)";
    }
    if (!password || !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password)) {
      newErrors.password = "Password must be 8+ characters with uppercase, lowercase, number, and special character";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please fix the form errors");
      return;
    }
    setIsLoading(true);

    try {
      if (mode === "register") {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, mobile, password }),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "Registration failed");
        }
      }

      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      toast.success(mode === "signin" ? "Signed in successfully" : "Registered and signed in successfully");
      setName("");
      setEmail("");
      setMobile("");
      setPassword("");
      setErrors({});
      onLoginSuccess();
    } catch (error) {
      console.error("Auth error:", error.message);
      toast.error(error.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn("google", { callbackUrl: "/" });
    } catch (error) {
      console.error("Google sign-in error:", error.message);
      toast.error("Google sign-in failed. Please try again.");
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === "signin" ? "register" : "signin");
    setErrors({});
    setName("");
    setEmail("");
    setMobile("");
    setPassword("");
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: "easeOut" } },
    exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } },
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <motion.div
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="bg-white dark:bg-slate-800 rounded-2xl p-8 w-full max-w-md relative shadow-2xl"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          aria-label="Close modal"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>
        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6 text-center">
          {mode === "signin" ? "Sign In" : "Create Account"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          {mode === "register" && (
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Full Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`mt-1 px-4 py-2 w-full rounded-md border ${
                  errors.name ? "border-red-500" : "border-gray-300 dark:border-slate-600"
                } dark:bg-slate-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors`}
                placeholder="John Doe"
                required
                aria-label="Full name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-500">{errors.name}</p>
              )}
            </div>
          )}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`mt-1 px-4 py-2 w-full rounded-md border ${
                errors.email ? "border-red-500" : "border-gray-300 dark:border-slate-600"
              } dark:bg-slate-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors`}
              placeholder="you@example.com"
              required
              aria-label="Email address"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-500">{errors.email}</p>
            )}
          </div>
          {mode === "register" && (
            <div>
              <label
                htmlFor="mobile"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Mobile Number (Optional)
              </label>
              <input
                id="mobile"
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className={`mt-1 px-4 py-2 w-full rounded-md border ${
                  errors.mobile ? "border-red-500" : "border-gray-300 dark:border-slate-600"
                } dark:bg-slate-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors`}
                placeholder="+1234567890 or 123-456-7890"
                aria-label="Mobile number"
              />
              {errors.mobile && (
                <p className="mt-1 text-sm text-red-500">{errors.mobile}</p>
              )}
            </div>
          )}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`mt-1 px-4 py-2 w-full rounded-md border ${
                errors.password ? "border-red-500" : "border-gray-300 dark:border-slate-600"
              } dark:bg-slate-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors`}
              placeholder="••••••••"
              required
              aria-label="Password"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-500">{errors.password}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={mode === "signin" ? "Sign in" : "Register"}
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 mx-auto text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
            ) : mode === "signin" ? (
              "Sign In"
            ) : (
              "Register"
            )}
          </button>
        </form>
        <button
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full mt-4 px-4 py-2 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-slate-600 rounded-md hover:bg-gray-100 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          aria-label="Sign in with Google"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M12.24 10.44v2.98h5.92c-.24 1.62-.96 2.94-2.46 3.84v3.18h3.96c2.34-2.16 3.66-5.34 3.66-9.06 0-.96-.12-1.86-.3-2.76h-10.78z"
            />
            <path
              fill="currentColor"
              d="M12 24c-3.36 0-6.42-1.2-8.82-3.18l-3.96 3.18c2.88 2.76 6.84 4.5 11.78 4.5 3.48 0 6.78-1.2 9.06-3.24l-3.96-3.18c-1.14.78-2.52 1.2-4.08 1.2z"
            />
            <path
              fill="currentColor"
              d="M12 4.8c1.86 0 3.54.66 4.86 1.74l2.88-2.88C17.34 1.62 14.46.6 12 .6 7.08.6 3.12 2.34.24 5.1l3.96 3.18C5.58 6.24 8.64 4.8 12 4.8z"
            />
            <path
              fill="currentColor"
              d="M3.18 12.66c-.18-.66-.3-1.38-.3-2.1s.12-1.44.3-2.1L.24 5.1C-.24 6.66 0 8.34 0 10.56s-.24 3.9.24 5.46l3.96-3.18z"
            />
          </svg>
          <span>{isLoading ? "Processing..." : "Sign in with Google"}</span>
        </button>
        <p className="mt-6 text-sm text-gray-600 dark:text-gray-300 text-center">
          {mode === "signin" ? "Don't have an account?" : "Already have an account?"}
          <button
            onClick={toggleMode}
            className="ml-1 text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
            aria-label={mode === "signin" ? "Switch to register" : "Switch to sign in"}
          >
            {mode === "signin" ? "Register" : "Sign In"}
          </button>
        </p>
      </motion.div>
    </div>
  );
}