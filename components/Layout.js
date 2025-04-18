import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Head from "next/head";
import { motion, AnimatePresence } from "framer-motion";
import {
  SunIcon,
  MoonIcon,
  Bars3Icon,
  XMarkIcon,
  UserIcon,
  UserPlusIcon,
  HomeIcon,
  CodeBracketIcon,
  RocketLaunchIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/solid";
import DOMPurify from "isomorphic-dompurify";
import { toast } from "react-hot-toast";
import LoginModal from "./LoginModal";
import ProfileModal from "./ProfileModal";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/router";

export default function Layout({
  children,
  title = "DevExplained - Coding & System Design Prep",
  description = "Master coding interviews with expertly crafted Leetcode solutions, system design guides, and programming challenges.",
  isLoginModalOpen: externalIsLoginModalOpen,
  setIsLoginModalOpen: externalSetIsLoginModalOpen,
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [theme, setTheme] = useState("light");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [internalIsLoginModalOpen, setInternalIsLoginModalOpen] = useState(false);
  const [initialModalMode, setInitialModalMode] = useState("signin");
  const [isThemeLoading, setIsThemeLoading] = useState(false);

  // Use external modal state if provided, else internal
  const isLoginModalOpen = externalIsLoginModalOpen !== undefined ? externalIsLoginModalOpen : internalIsLoginModalOpen;
  const setIsLoginModalOpen = externalSetIsLoginModalOpen || setInternalIsLoginModalOpen;

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme);
    document.documentElement.classList.toggle("dark", savedTheme === "dark");

    const urlParams = new URLSearchParams(window.location.search);
    const oauthError = urlParams.get("error");
    if (oauthError) {
      console.error("OAuth error:", oauthError);
      toast.error(`Authentication failed: ${oauthError}`, { duration: 5000 });
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setIsThemeLoading(true);
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
    setTimeout(() => setIsThemeLoading(false), 300);
  }, [theme]);

  const openModal = useCallback((mode) => {
    setInitialModalMode(mode);
    setIsLoginModalOpen(true);
    setIsMenuOpen(false);
    setIsProfileDropdownOpen(false);
  }, [setIsLoginModalOpen]);

  const toggleMenu = useCallback(() => {
    setIsMenuOpen((prev) => !prev);
    setIsProfileDropdownOpen(false);
  }, []);

  const toggleProfileDropdown = useCallback(() => {
    setIsProfileDropdownOpen((prev) => !prev);
    setIsMenuOpen(false);
  }, []);

  const menuVariants = {
    hidden: { opacity: 0, x: "100%" },
    visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: "easeOut" } },
    exit: { opacity: 0, x: "100%", transition: { duration: 0.3 } },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-800 text-gray-900 dark:text-gray-100 transition-colors duration-500 flex flex-col font-sans">
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="robots" content="index, follow" />
        <meta name="keywords" content="leetcode, system design, coding, algorithms, interview prep, programming" />
        <meta name="author" content="DevExplained Team" />
        <meta name="description" content={description} />
        <meta property="og:site_name" content="DevExplained" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://devexplained.vercel.app" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content="https://devexplained.vercel.app/og-image.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content="https://devexplained.vercel.app/twitter-image.jpg" />
        <title>{title}</title>
        <link rel="canonical" href="https://devexplained.vercel.app" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#4f46e5" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(
              JSON.stringify({
                "@context": "https://schema.org",
                "@type": "WebSite",
                "name": "DevExplained",
                "url": "https://devexplained.vercel.app",
                "description": description,
                "publisher": {
                  "@type": "Organization",
                  "name": "DevExplained Team",
                },
                "potentialAction": {
                  "@type": "SearchAction",
                  "target": "https://devexplained.vercel.app/search?q={search_term_string}",
                  "query-input": "required name=search_term_string",
                },
              })
            ),
          }}
        />
      </Head>

      <header className="bg-white/90 dark:bg-slate-900/90 shadow-xl p-4 sticky top-0 z-50 backdrop-blur-lg border-b border-gray-200/50 dark:border-slate-700/50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link
            href="/"
            className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 tracking-tight hover:scale-105 transition-transform duration-200"
            aria-label="DevExplained Home"
          >
            DevExplained
          </Link>
          <nav role="navigation" aria-label="Main navigation" className="hidden md:flex items-center space-x-6">
            <Link
              href="/"
              className="text-sm font-semibold text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200"
              aria-current={router.pathname === "/" ? "page" : undefined}
            >
              Home
            </Link>
            <Link
              href="/leetcode"
              className="text-sm font-semibold text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200"
              aria-current={router.pathname === "/leetcode" ? "page" : undefined}
            >
              Leetcode
            </Link>
            <Link
              href="/system-design"
              className="text-sm font-semibold text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200"
              aria-current={router.pathname === "/system-design" ? "page" : undefined}
            >
              System Design
            </Link>
            {status === "authenticated" ? (
              <button
                onClick={() => setIsProfileDropdownOpen(true)}
                className="flex items-center space-x-2 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200"
                aria-label={`Open profile for ${session?.user?.name || session?.user?.email}`}
              >
                <UserIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                <span className="truncate max-w-[120px]">
                  {session?.user?.name || session?.user?.email?.split("@")[0] || "User"}
                </span>
              </button>
            ) : (
              <>
                <button
                  onClick={() => openModal("signin")}
                  className="flex items-center space-x-1 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200"
                  aria-label="Sign in"
                >
                  <UserIcon className="w-4 h-4" />
                  <span>Sign In</span>
                </button>
                <button
                  onClick={() => openModal("register")}
                  className="flex items-center space-x-1 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200"
                  aria-label="Register"
                >
                  <UserPlusIcon className="w-4 h-4" />
                  <span>Register</span>
                </button>
              </>
            )}
            <button
              onClick={toggleTheme}
              disabled={isThemeLoading}
              className="p-2 rounded-full hover:bg-gray-100/50 dark:hover:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-200 disabled:opacity-50"
              aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            >
              {theme === "light" ? (
                <MoonIcon className="w-5 h-5 text-gray-800 dark:text-gray-200" />
              ) : (
                <SunIcon className="w-5 h-5 text-yellow-400" />
              )}
            </button>
          </nav>
          <button
            className="md:hidden p-2 rounded-full hover:bg-gray-100/50 dark:hover:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-200"
            onClick={toggleMenu}
            aria-label="Toggle menu"
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? (
              <XMarkIcon className="w-6 h-6 text-gray-800 dark:text-gray-100" />
            ) : (
              <Bars3Icon className="w-6 h-6 text-gray-800 dark:text-gray-100" />
            )}
          </button>
        </div>
        <AnimatePresence>
          {isMenuOpen && (
            <motion.nav
              variants={menuVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="md:hidden mt-4 flex flex-col space-y-4 bg-white/95 dark:bg-slate-900/95 p-6 rounded-2xl shadow-2xl border border-gray-200/50 dark:border-slate-700/50"
              role="navigation"
              aria-label="Mobile navigation"
            >
              <Link
                href="/"
                className="flex items-center space-x-2 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200"
                onClick={toggleMenu}
                aria-current={router.pathname === "/" ? "page" : undefined}
              >
                <HomeIcon className="w-5 h-5" />
                <span>Home</span>
              </Link>
              <Link
                href="/leetcode"
                className="flex items-center space-x-2 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200"
                onClick={toggleMenu}
                aria-current={router.pathname === "/leetcode" ? "page" : undefined}
              >
                <CodeBracketIcon className="w-5 h-5" />
                <span>Leetcode</span>
              </Link>
              <Link
                href="/system-design"
                className="flex items-center space-x-2 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200"
                onClick={toggleMenu}
                aria-current={router.pathname === "/system-design" ? "page" : undefined}
              >
                <RocketLaunchIcon className="w-5 h-5" />
                <span>System Design</span>
              </Link>
              {status === "authenticated" ? (
                <>
                  <button
                    onClick={toggleProfileDropdown}
                    className="flex items-center space-x-2 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200"
                    aria-label={`Toggle profile options for ${session?.user?.name || session?.user?.email}`}
                    aria-expanded={isProfileDropdownOpen}
                  >
                    <UserIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <span className="truncate max-w-[200px]">
                      {session?.user?.name || session?.user?.email?.split("@")[0] || "User"}
                    </span>
                  </button>
                  <AnimatePresence>
                    {isProfileDropdownOpen && (
                      <ProfileModal
                        isOpen={isProfileDropdownOpen}
                        onClose={() => setIsProfileDropdownOpen(false)}
                        isMobile={true}
                      />
                    )}
                  </AnimatePresence>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      openModal("signin");
                      toggleMenu();
                    }}
                    className="flex items-center space-x-2 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200"
                    aria-label="Sign in"
                  >
                    <UserIcon className="w-5 h-5" />
                    <span>Sign In</span>
                  </button>
                  <button
                    onClick={() => {
                      openModal("register");
                      toggleMenu();
                    }}
                    className="flex items-center space-x-2 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200"
                    aria-label="Register"
                  >
                    <UserPlusIcon className="w-5 h-5" />
                    <span>Register</span>
                  </button>
                </>
              )}
              <button
                onClick={() => {
                  toggleTheme();
                  toggleMenu();
                }}
                disabled={isThemeLoading}
                className="flex items-center space-x-2 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200 disabled:opacity-50"
                aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
              >
                {theme === "light" ? (
                  <MoonIcon className="w-5 h-5" />
                ) : (
                  <SunIcon className="w-5 h-5 text-yellow-400" />
                )}
                <span>{theme === "light" ? "Dark Mode" : "Light Mode"}</span>
              </button>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        {children}
      </main>

      <footer className="bg-white/80 dark:bg-slate-900/80 border-t border-gray-200/50 dark:border-slate-700/50 py-12 text-center text-sm text-gray-600 dark:text-gray-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4">DevExplained</h3>
              <p className="text-sm leading-relaxed">
                Master coding interviews with expertly crafted solutions and system design guides.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4">Quick Links</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/about" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200 text-sm">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200 text-sm">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200 text-sm">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200 text-sm">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4">Connect</h3>
              <ul className="space-y-3">
                <li>
                  <a
                    href="https://github.com/devexplained"
                    className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200 text-sm"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="GitHub"
                  >
                    GitHub
                  </a>
                </li>
                <li>
                  <a
                    href="https://twitter.com/devexplained"
                    className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200 text-sm"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Twitter"
                  >
                    Twitter
                  </a>
                </li>
                <li>
                  <a
                    href="https://linkedin.com/company/devexplained"
                    className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200 text-sm"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="LinkedIn"
                  >
                    LinkedIn
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <p className="mt-12 text-sm font-medium">© {new Date().getFullYear()} DevExplained. All rights reserved.</p>
        </div>
      </footer>

      <AnimatePresence>
        {isLoginModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/50 z-50"
          >
            <LoginModal
              isOpen={isLoginModalOpen}
              onClose={() => setIsLoginModalOpen(false)}
              initialMode={initialModalMode}
              onLoginSuccess={() => {
                setIsLoginModalOpen(false);
                toast.success("Logged in successfully");
              }}
            />
          </motion.div>
        )}
        {status === "authenticated" && !isMenuOpen && (
          <ProfileModal
            isOpen={isProfileDropdownOpen}
            onClose={() => setIsProfileDropdownOpen(false)}
            isMobile={false}
          />
        )}
      </AnimatePresence>
    </div>
  );
}