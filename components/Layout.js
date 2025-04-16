import Link from "next/link";
import Head from "next/head";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { SunIcon, MoonIcon, Bars3Icon, XMarkIcon } from "@heroicons/react/24/solid";
import DOMPurify from "isomorphic-dompurify";

export default function Layout({ children }) {
  const [theme, setTheme] = useState("light");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Load theme
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme);
    document.documentElement.classList.toggle("dark", savedTheme === "dark");
  }, []);

  // Toggle theme
  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  // Toggle mobile menu
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 text-gray-800 dark:text-gray-100 transition-colors duration-300 flex flex-col">
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="robots" content="index, follow" />
        <meta
          name="keywords"
          content="leetcode, system design, coding, algorithms, interview prep, programming"
        />
        <meta name="author" content="LeetcodeSolve Team" />
        <meta
          name="description"
          content="LeetcodeSolve: Master coding interviews with Leetcode solutions, system design guides, and more."
        />
        <meta property="og:site_name" content="LeetcodeSolve" />
        <meta property="og:type" content="website" />
        <meta
          property="og:url"
          content="https://leetcodesolve.vercel.app"
        />
        <meta
          property="og:title"
          content="LeetcodeSolve - Coding & System Design Prep"
        />
        <meta
          property="og:description"
          content="Prepare for technical interviews with Leetcode solutions, system design tutorials, and coding challenges."
        />
        <meta
          property="og:image"
          content="https://leetcodesolve.vercel.app/og-image.jpg"
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="LeetcodeSolve - Coding & System Design Prep"
        />
        <meta
          name="twitter:description"
          content="Prepare for technical interviews with Leetcode solutions, system design tutorials, and coding challenges."
        />
        <meta
          name="twitter:image"
          content="https://leetcodesolve.vercel.app/twitter-image.jpg"
        />
        <link rel="canonical" href="https://leetcodesolve.vercel.app" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="manifest" href="/site.webmanifest" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(
              JSON.stringify({
                "@context": "https://schema.org",
                "@type": "WebSite",
                "name": "LeetcodeSolve",
                "url": "https://leetcodesolve.vercel.app",
                "description": "Master coding interviews with Leetcode solutions and system design guides.",
                "publisher": {
                  "@type": "Organization",
                  "name": "LeetcodeSolve Team",
                },
                "potentialAction": {
                  "@type": "SearchAction",
                  "target": "https://leetcodesolve.vercel.app/search?q={search_term_string}",
                  "query-input": "required name=search_term_string",
                },
              })
            ),
          }}
        />
      </Head>

      {/* Sticky Header */}
      <header className="bg-white dark:bg-slate-800 shadow-md p-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            LeetcodeSolve
          </Link>
          {/* Desktop Nav */}
          <nav role="navigation" className="hidden md:flex items-center space-x-6">
            <Link
              href="/"
              className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
              aria-current={children.props?.pathname === "/" ? "page" : undefined}
            >
              Home
            </Link>
            <Link
              href="/leetcode"
              className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
              aria-current={children.props?.pathname === "/leetcode" ? "page" : undefined}
            >
              Leetcode
            </Link>
            <Link
              href="/system-design"
              className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
              aria-current={children.props?.pathname === "/system-design" ? "page" : undefined}
            >
              System Design
            </Link>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            >
              {theme === "light" ? (
                <MoonIcon className="w-5 h-5 text-gray-800" />
              ) : (
                <SunIcon className="w-5 h-5 text-gray-100" />
              )}
            </button>
          </nav>
          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
        {/* Mobile Nav */}
        {isMenuOpen && (
          <motion.nav
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden mt-4 flex flex-col space-y-4 bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md"
            role="navigation"
          >
            <Link
              href="/"
              className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
              onClick={toggleMenu}
              aria-current={children.props?.pathname === "/" ? "page" : undefined}
            >
              Home
            </Link>
            <Link
              href="/leetcode"
              className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
              onClick={toggleMenu}
              aria-current={children.props?.pathname === "/leetcode" ? "page" : undefined}
            >
              Leetcode
            </Link>
            <Link
              href="/system-design"
              className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
              onClick={toggleMenu}
              aria-current={children.props?.pathname === "/system-design" ? "page" : undefined}
            >
              System Design
            </Link>
            <button
              onClick={() => {
                toggleTheme();
                toggleMenu();
              }}
              className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400"
              aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            >
              {theme === "light" ? (
                <MoonIcon className="w-5 h-5" />
              ) : (
                <SunIcon className="w-5 h-5" />
              )}
              <span>{theme === "light" ? "Dark Mode" : "Light Mode"}</span>
            </button>
          </motion.nav>
        )}
      </header>

      <main className="flex-grow">{children}</main>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-800 border-t py-6 text-center text-sm text-gray-500 dark:text-gray-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p>© {new Date().getFullYear()} LeetcodeSolve. All rights reserved.</p>
            <div className="flex gap-4 sm:gap-6">
              <Link href="/about" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">
                About
              </Link>
              <Link href="/contact" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">
                Contact
              </Link>
              <a
                href="https://github.com/leetcodesolve"
                className="hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
              >
                GitHub
              </a>
              <Link href="/privacy" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}