import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";
import Link from "next/link";
import { useState, useCallback, useEffect, useMemo, memo, useRef } from "react";
import { Toaster, toast } from "react-hot-toast";
import { Component } from "react";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark.css";
import { motion } from "framer-motion";

// Error Boundary Component
class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <p className="text-red-500 text-center py-4">Failed to render code block</p>;
    }
    return this.props.children;
  }
}

export async function getStaticPaths() {
  const files = fs.readdirSync("posts");
  const paths = files.map((filename) => ({
    params: {
      id: filename.replace(".md", ""),
    },
  }));

  return {
    paths,
    fallback: false,
  };
}

export async function getStaticProps({ params }) {
  const filePath = path.join("posts", `${params.id}.md`);
  const fileContent = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(fileContent);

  const langs = ["cpp", "python"]; // Removed Java
  const codeBlocks = {};

  langs.forEach((lang) => {
    const regex = new RegExp(`\`\`\`${lang}\n([\\s\\S]*?)\n\`\`\``, "i");
    const match = content.match(regex);
    codeBlocks[lang] = match ? match[1].trim() : "";
  });

  // Extract content before the first code block
  const explanationContent = content.split(/```[a-z]+/i)[0].trim();
  const processedContent = await remark().use(html).process(explanationContent);
  const contentHtml = processedContent.toString();

  return {
    props: {
      frontMatter: data,
      contentHtml,
      codeBlocks,
    },
  };
}

// Memoize the component
const ProblemPage = memo(function ProblemPage({ frontMatter, contentHtml, codeBlocks }) {
  const [activeTab, setActiveTab] = useState("cpp");
  const [copyIcon, setCopyIcon] = useState("copy");
  const [theme, setTheme] = useState("light");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const codeRef = useRef(null);

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

  // Highlight code
  useEffect(() => {
    if (typeof window !== "undefined" && codeRef.current) {
      try {
        if (codeRef.current.dataset.highlighted) {
          delete codeRef.current.dataset.highlighted;
        }
        hljs.highlightElement(codeRef.current);
      } catch (error) {
        console.error("Failed to highlight code:", error);
        toast.error("Failed to highlight code");
      }
    }
  }, [activeTab]);

  const copyToClipboard = useCallback(async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopyIcon("check");
      toast.success("Code copied to clipboard!", {
        duration: 2000,
        position: "bottom-right",
      });
      setTimeout(() => setCopyIcon("copy"), 2000);
    } catch (err) {
      toast.error("Failed to copy code");
      console.error("Failed to copy code:", err);
    }
  }, []);

  // Memoize difficulty styling
  const difficultyStyle = useMemo(() => {
    switch (frontMatter.difficulty) {
      case "Easy":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "Medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "Hard":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-gray-200";
    }
  }, [frontMatter.difficulty]);

  // Animation variants
  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 text-gray-800 dark:text-gray-100 transition-colors duration-300">
      <Toaster />

      {/* Sticky Header */}
      <header className="bg-white dark:bg-slate-800 shadow-md p-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            LeetcodeSolve
          </Link>
          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/" className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition">
              Home
            </Link>
            <Link href="/leetcode" className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition">
              Leetcode
            </Link>
            <Link href="/interview" className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition">
              Interview
            </Link>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            >
              {theme === "light" ? (
                <svg className="w-5 h-5 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-gray-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              )}
            </button>
          </nav>
          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 focus:outline-none"
            onClick={toggleMenu}
            aria-label="Toggle menu"
            aria-expanded={isMenuOpen}
          >
            <svg className="w-6 h-6 text-gray-800 dark:text-gray-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16m-7 6h7"} />
            </svg>
          </button>
        </div>
        {/* Mobile Nav */}
        {isMenuOpen && (
          <motion.nav
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden mt-4 flex flex-col space-y-4 bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md"
          >
            <Link href="/" className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition" onClick={toggleMenu}>
              Home
            </Link>
            <Link href="/leetcode" className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition" onClick={toggleMenu}>
              Leetcode
            </Link>
            <Link href="/interview" className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition" onClick={toggleMenu}>
              Interview
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
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              )}
              <span>{theme === "light" ? "Dark Mode" : "Light Mode"}</span>
            </button>
          </motion.nav>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Problem Header */}
        <motion.div
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 sm:p-8 mb-6"
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-4">
            {frontMatter.title || "Untitled Problem"}
          </h1>
          <div className="flex items-center gap-4 flex-wrap">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${difficultyStyle}`}
            >
              {frontMatter.difficulty || "Unknown"}
            </span>
            {frontMatter.tags?.map((tag) => (
              <Link
                key={tag}
                href={`/leetcode/tags/${tag}`}
                className="px-3 py-1 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 rounded-full text-sm hover:bg-gray-200 dark:hover:bg-slate-600 transition"
              >
                {tag}
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Problem Explanation */}
        <motion.div
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 sm:p-8 mb-6"
        >
          <div
            className="prose prose-gray dark:prose-invert max-w-none text-gray-700 dark:text-gray-200"
            dangerouslySetInnerHTML={{ __html: contentHtml || "<p>No explanation available.</p>" }}
          />
        </motion.div>

        {/* Solutions */}
        <motion.div
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-slate-800 rounded-xl shadow-md"
        >
          <div className="border-b border-gray-200 dark:border-slate-700">
            <div className="flex" role="tablist" aria-label="Programming languages">
              {["cpp", "python"].map((lang) => (
                <button
                  key={lang}
                  role="tab"
                  aria-selected={activeTab === lang}
                  aria-controls={`panel-${lang}`}
                  id={`tab-${lang}`}
                  onClick={() => setActiveTab(lang)}
                  className={`px-4 sm:px-6 py-3 font-medium text-sm sm:text-base focus:outline-none transition-colors ${
                    activeTab === lang
                      ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 bg-indigo-50 dark:bg-slate-700"
                      : "text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-slate-700"
                  }`}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 sm:p-6">
            <ErrorBoundary>
              {codeBlocks[activeTab] ? (
                <div className="relative group">
                  <button
                    onClick={() => copyToClipboard(codeBlocks[activeTab])}
                    className="absolute right-3 top-3 p-2 rounded-md bg-gray-700/50 text-gray-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    title="Copy code"
                    aria-label="Copy code to clipboard"
                  >
                    {copyIcon === "copy" ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-green-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </button>
                  <div className="bg-gray-900 rounded-lg overflow-hidden">
                    <pre>
                      <code ref={codeRef} className={`language-${activeTab}`}>
                        {codeBlocks[activeTab]}
                      </code>
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500 dark:text-gray-400">
                    Solution not available in {activeTab.toUpperCase()}
                  </p>
                </div>
              )}
            </ErrorBoundary>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-800 border-t py-6 text-center text-sm text-gray-500 dark:text-gray-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p>© {new Date().getFullYear()} LeetcodeSolve. All rights reserved.</p>
            <div className="flex gap-4 sm:gap-6">
              <a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">
                About
              </a>
              <a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">
                Contact
              </a>
              <a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">
                GitHub
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
});

export default ProblemPage;