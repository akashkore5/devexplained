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
import Layout from "../../components/Layout";
import { useRouter } from "next/router";
import Head from "next/head";
import DOMPurify from "dompurify";
import { useSession } from "next-auth/react";
import { CheckCircleIcon, HeartIcon } from "@heroicons/react/24/solid";
import dynamic from "next/dynamic";

// Monaco Editor with SSR disabled
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

// Configure DOMPurify for server-side rendering
let purify;
if (typeof window === "undefined") {
  const { JSDOM } = require("jsdom");
  const jsdomWindow = new JSDOM("").window;
  purify = DOMPurify(jsdomWindow);
} else {
  purify = DOMPurify;
}

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
  const postsDir = path.join(process.cwd(), "posts");
  let files;
  try {
    files = fs.readdirSync(postsDir);
  } catch (error) {
    console.error("Error reading posts directory:", error);
    files = [];
  }

  const paths = files
    .filter((filename) => filename.endsWith(".md"))
    .map((filename) => ({
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
  try {
    const filePath = path.join("posts", `${params.id}.md`);
    if (!fs.existsSync(filePath)) {
      return { notFound: true };
    }
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const { data, content } = matter(fileContent);

    const langs = ["java", "cpp", "python"];
    const codeBlocks = {};

    langs.forEach((lang) => {
      const regex = new RegExp(`\`\`\`${lang}\n([\\s\\S]*?)\n\`\`\``, "i");
      const match = content.match(regex);
      codeBlocks[lang] = match ? match[1].trim() : "";
    });

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
  } catch (error) {
    console.error("Error in getStaticProps:", error);
    return { notFound: true };
  }
}

// Memoize the component
const ProblemPage = memo(function ProblemPage({ frontMatter, contentHtml, codeBlocks }) {
  const [activeTab, setActiveTab] = useState("java");
  const [copyIcon, setCopyIcon] = useState("copy");
  const [isSolving, setIsSolving] = useState(false);
  const [isTagging, setIsTagging] = useState(false);
  const [isSolved, setIsSolved] = useState(false);
  const [isTagged, setIsTagged] = useState(false);
  const [editorCode, setEditorCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [executionResult, setExecutionResult] = useState(null);
  const codeRef = useRef(null);
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Calculate next and previous IDs
  const currentId = parseInt(frontMatter.id, 10);
  const nextId = currentId + 1;
  const prevId = currentId > 1 ? currentId - 1 : null;

  // Sanitize HTML content
  const sanitizedContentHtml = useMemo(() => {
    return purify.sanitize(contentHtml, { USE_PROFILES: { html: true } });
  }, [contentHtml]);

  // Check initial progress status
  useEffect(() => {
    if (status !== "authenticated") return;

    const checkProgress = async () => {
      try {
        const response = await fetch("/api/user/progress/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "leetcode", action: "all", id: currentId }),
        });
        const data = await response.json();
        setIsSolved(data.solved || false);
        setIsTagged(data.tagged || false);
      } catch (error) {
        console.error("Error checking progress:", error);
      }
    };

    checkProgress();
  }, [currentId, status]);

  // Highlight code
  useEffect(() => {
    if (typeof window !== "undefined" && codeRef.current) {
      try {
        if (!codeBlocks[activeTab]) {
          console.warn(`No code available for language: ${activeTab}`);
          return;
        }
        if (codeRef.current.dataset.highlighted) {
          delete codeRef.current.dataset.highlighted;
        }
        hljs.highlightElement(codeRef.current);
      } catch (error) {
        console.error("Failed to highlight code:", error);
        toast.error("Failed to highlight code");
      }
    }
  }, [activeTab, codeBlocks]);

  // Fetch main method code for editor
  useEffect(() => {
    const fetchMainCode = async () => {
      try {
        const response = await fetch(`/api/main-code?lang=${activeTab}&id=${currentId}`);
        const data = await response.json();
        if (data.code) {
          // Remove triple backticks and surrounding newlines
          const cleanedCode = data.code.replace(/^```[\s\S]*?\n([\s\S]*)\n```$/, '$1').trim();
          setEditorCode(cleanedCode);
        } else {
          setEditorCode(codeBlocks[activeTab] || "");
        }
      } catch (error) {
        console.error("Error fetching main code:", error);
        toast.error("Failed to load main code");
        setEditorCode(codeBlocks[activeTab] || "");
      }
    };

    fetchMainCode();
  }, [activeTab, currentId, codeBlocks]);

  // Mark problem as viewed
  useEffect(() => {
    if (status !== "authenticated") return;

    const checkAndMarkViewed = async () => {
      try {
        const response = await fetch("/api/user/progress/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "leetcode", action: "viewed", id: currentId }),
        });
        const data = await response.json();
        if (data.isPresent) return;

        const markResponse = await fetch("/api/user/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "leetcode", action: "viewed", id: currentId }),
        });
        if (!markResponse.ok) {
          console.error("Failed to mark viewed:", markResponse.statusText);
        }
      } catch (error) {
        console.error("Error checking/marking viewed:", error);
      }
    };

    checkAndMarkViewed();
  }, [currentId, status]);

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

  const handleToggleSolved = useCallback(async () => {
    if (status !== "authenticated") {
      setIsLoginModalOpen(true);
      return;
    }

    setIsSolving(true);
    try {
      const response = await fetch("/api/user/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "leetcode",
          action: "solved",
          id: currentId,
          remove: isSolved ? true : false,
        }),
      });
      if (response.ok) {
        setIsSolved(!isSolved);
        toast.success(isSolved ? "Problem unmarked as solved" : "Problem marked as solved!");
      } else {
        toast.error("Failed to update solved status");
      }
    } catch (error) {
      console.error("Error updating solved status:", error);
      toast.error("An error occurred");
    } finally {
      setIsSolving(false);
    }
  }, [currentId, status, isSolved]);

  const handleToggleTagged = useCallback(async () => {
    if (status !== "authenticated") {
      setIsLoginModalOpen(true);
      return;
    }

    setIsTagging(true);
    try {
      const response = await fetch("/api/user/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "leetcode",
          action: "tagged",
          id: currentId,
          remove: isTagged ? true : false,
        }),
      });
      if (response.ok) {
        setIsTagged(!isTagged);
        toast.success(isTagged ? "Problem untagged" : "Problem tagged!");
      } else {
        toast.error("Failed to update tag status");
      }
    } catch (error) {
      console.error("Error updating tag status:", error);
      toast.error("An error occurred");
    } finally {
      setIsTagging(false);
    }
  }, [currentId, status, isTagged]);

  const handleRunCode = useCallback(async () => {
    if (!editorCode) {
      toast.error("No code to execute");
      return;
    }

    setIsSubmitting(true);
    setExecutionResult(null);

    try {
      const response = await fetch("https://judge0-ce.p.rapidapi.com/submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-RapidAPI-Key": process.env.JUDGE0_API_KEY,
          "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
        },
        body: JSON.stringify({
          source_code: editorCode,
          language_id: activeTab === "java" ? 62 : activeTab === "cpp" ? 54 : 71,
          stdin: "",
        }),
      });

      if (!response.ok) {
        throw new Error(`Judge0 submission failed: ${response.statusText}`);
      }

      const { token } = await response.json();

      // Poll for results
      let result;
      for (let i = 0; i < 10; i++) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const statusResponse = await fetch(
          `https://judge0-ce.p.rapidapi.com/submissions/${token}?base64_encoded=true`,
          {
            headers: {
              "X-RapidAPI-Key": process.env.JUDGE0_API_KEY,
              "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
            },
          }
        );
        result = await statusResponse.json();
        if (result.status.id > 2) break;
      }

      // Parse error messages for line numbers (if available)
      let errorDetails = null;
      if (result.stderr) {
        const stderr = atob(result.stderr);
        const lineMatch = stderr.match(/:(\d+):/);
        errorDetails = {
          message: stderr,
          line: lineMatch ? parseInt(lineMatch[1]) : null,
        };
      }

      setExecutionResult({
        stdout: result.stdout ? atob(result.stdout) : null,
        stderr: errorDetails ? errorDetails.message : null,
        line: errorDetails ? errorDetails.line : null,
        status: result.status.description,
      });
    } catch (error) {
      console.error("Error executing code:", error);
      toast.error("Failed to execute code: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  }, [editorCode, activeTab]);

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

  // Enhanced Structured Data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `${frontMatter.id}. ${frontMatter.title || "Leetcode Solution"}`,
    description: `Solve Leetcode problem ${frontMatter.id}: ${frontMatter.title || "Untitled Problem"} with optimized solutions in Java, C++, and Python. Includes detailed explanations, code editor, and execution results.`,
    keywords: `Leetcode ${frontMatter.id}, ${frontMatter.title}, ${frontMatter.difficulty || "programming"} problem, coding solution, Java, C++, Python, algorithms, data structures, coding interview`,
    author: {
      "@type": "Organization",
      name: "LeetcodeSolve",
    },
    publisher: {
      "@type": "Organization",
      name: "LeetcodeSolve",
      logo: {
        "@type": "ImageObject",
        url: "https://leetcodesolve.vercel.app/logo.png",
        width: 150,
        height: 50,
      },
    },
    datePublished: frontMatter.date || new Date().toISOString(),
    dateModified: new Date().toISOString(),
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://leetcodesolve.vercel.app/leetcode/${frontMatter.id}`,
    },
    image: [
      "https://leetcodesolve.vercel.app/og-image.jpg",
      `https://leetcodesolve.vercel.app/leetcode-${frontMatter.id}-solution.png`,
    ],
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://leetcodesolve.vercel.app/",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Leetcode Solutions",
          item: "https://leetcodesolve.vercel.app/leetcode",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: `${frontMatter.id}. ${frontMatter.title}`,
          item: `https://leetcodesolve.vercel.app/leetcode/${frontMatter.id}`,
        },
      ],
    },
  };

  return (
    <Layout
      title={`${frontMatter.id}. ${frontMatter.title || "Leetcode Solution"} - LeetcodeSolve`}
      description={`Solve Leetcode problem ${frontMatter.id}: ${frontMatter.title || "Untitled Problem"} with optimized Java, C++, and Python solutions, detailed explanations, and interactive code editor.`}
      isLoginModalOpen={isLoginModalOpen}
      setIsLoginModalOpen={setIsLoginModalOpen}
    >
      <Head>
        <meta
          name="keywords"
          content={`Leetcode ${frontMatter.id}, ${frontMatter.title}, ${frontMatter.difficulty || "programming"} solution, Java, C++, Python, algorithms, data structures, coding interview, Leetcode problem, optimized code`}
        />
        <meta name="description" content={`Master Leetcode problem ${frontMatter.id}: ${frontMatter.title || "Untitled Problem"} with step-by-step solutions in Java, C++, and Python, plus interactive code execution.`} />
        <meta name="author" content="LeetcodeSolve Team" />
        <meta name="robots" content="index, follow" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta
          property="og:title"
          content={`${frontMatter.id}. ${frontMatter.title || "Leetcode Solution"} - LeetcodeSolve`}
        />
        <meta
          property="og:description"
          content={`Solve Leetcode ${frontMatter.id}: ${frontMatter.title || "Untitled Problem"} with optimized Java, C++, and Python code, detailed explanations, and an interactive editor.`}
        />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`https://leetcodesolve.vercel.app/leetcode/${frontMatter.id}`} />
        <meta property="og:image" content={`https://leetcodesolve.vercel.app/leetcode-${frontMatter.id}-solution.png`} />
        <meta property="og:image:alt" content={`Leetcode ${frontMatter.id}: ${frontMatter.title} solution preview`} />
        <meta property="og:site_name" content="LeetcodeSolve" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content={`${frontMatter.id}. ${frontMatter.title || "Leetcode Solution"} - LeetcodeSolve`}
        />
        <meta
          name="twitter:description"
          content={`Master Leetcode ${frontMatter.id}: ${frontMatter.title || "Untitled Problem"} with expert Java, C++, and Python solutions and interactive coding.`}
        />
        <meta name="twitter:image" content={`https://leetcodesolve.vercel.app/leetcode-${frontMatter.id}-solution.png`} />
        <meta name="twitter:image:alt" content={`Leetcode ${frontMatter.id}: ${frontMatter.title} solution preview`} />
        <meta name="twitter:creator" content="@LeetcodeSolve" />
        <link rel="canonical" href={`https://leetcodesolve.vercel.app/leetcode/${frontMatter.id}`} />
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
        <link rel="sitemap" href="/sitemap.xml" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="theme-color" content="#4f46e5" />
        <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
        <meta name="google-site-verification" content="YOUR_GOOGLE_VERIFICATION_CODE" />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Head>
      <Toaster />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-8">
        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Problem Header */}
          <motion.header
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 sm:p-8 mb-6"
          >
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-6">
              {frontMatter.id}. {frontMatter.title || "Untitled Problem"}
            </h1>
            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={() => router.push(`/leetcode?difficulty=${frontMatter.difficulty}`)}
                className={`px-4 py-2 rounded-full text-sm font-semibold ${difficultyStyle} cursor-pointer transition-colors duration-200`}
                aria-label={`Filter by ${frontMatter.difficulty} difficulty`}
              >
                {frontMatter.difficulty || "Unknown"}
              </button>
              {frontMatter.tags?.map((tag) => (
                <Link
                  key={tag}
                  href={`/leetcode/tags/${tag}`}
                  className="px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 rounded-full text-sm font-medium hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors duration-200"
                  prefetch={false}
                >
                  {tag}
                </Link>
              ))}
              <motion.button
                onClick={handleToggleSolved}
                disabled={isSolving}
                className={`flex items-center px-4 py-2 rounded-lg shadow-md transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  isSolved
                    ? "bg-gradient-to-r from-green-600 to-green-700 dark:from-green-800 dark:to-green-900 text-white"
                    : "bg-gradient-to-r from-gray-600 to-gray-700 dark:from-gray-800 dark:to-gray-900 text-white"
                } hover:scale-105 disabled:opacity-50`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label={isSolved ? "Unmark as solved" : "Mark as solved"}
              >
                <CheckCircleIcon className="w-5 h-5 mr-2" />
                {isSolving ? "Processing..." : "Solved"}
              </motion.button>
              <motion.button
                onClick={handleToggleTagged}
                disabled={isTagging}
                className={`flex items-center px-4 py-2 rounded-lg shadow-md transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                  isTagged
                    ? "bg-gradient-to-r from-pink-600 to-pink-700 dark:from-pink-800 dark:to-pink-900 text-white"
                    : "bg-gradient-to-r from-gray-600 to-gray-700 dark:from-gray-800 dark:to-gray-900 text-white"
                } hover:scale-105 disabled:opacity-50`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label={isTagged ? "Untag problem" : "Tag problem"}
              >
                <HeartIcon className="w-5 h-5 mr-2" />
                {isTagging ? "Processing..." : "Tag"}
              </motion.button>
            </div>
          </motion.header>

          {/* Problem Explanation */}
          <motion.section
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 sm:p-8 mb-6"
          >
            <div
              className="prose prose-gray dark:prose-invert max-w-none text-gray-700 dark:text-gray-200"
              dangerouslySetInnerHTML={{ __html: sanitizedContentHtml || "<p>No explanation available.</p>" }}
              aria-label="Problem explanation"
            />
            <div className="mt-6">
              <a
                href={`https://leetcode.com/problems/${frontMatter.title.replace(/\s+/g, '-').toLowerCase()}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 dark:from-indigo-800 dark:to-indigo-900 text-white rounded-lg shadow-md hover:scale-105 transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                View Leetcode Problem
              </a>
            </div>
          </motion.section>

          {/* Solutions */}
          <motion.section
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-slate-800 rounded-xl shadow-lg mb-6"
          >
            <nav className="border-b border-gray-200 dark:border-slate-700">
              <div className="flex" role="tablist" aria-label="Programming languages">
                {["java", "cpp", "python"].map((lang) => (
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
            </nav>

            <div className="p-0 sm:p-2">
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
          </motion.section>

          {/* Code Editor */}
          <motion.section
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.5 }}
            className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 sm:p-8 mb-6"
          >
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
              Code Editor (Testing phase)
            </h2>
            <div className="mb-4 p-4 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-lg">
              <h3 className="font-semibold mb-2">Improve Your Solution</h3>
              <div className="text-sm">
                <p className="mb-2">
                  Use the editor below to refine the provided solution. Select a programming language and try the following:
                </p>
                <ul className="list-disc list-inside">
                  <li>Add import statement if required.</li>
                  <li>Optimize the code for better time or space complexity.</li>
                  <li>Add test cases to validate edge cases and common scenarios.</li>
                  <li>Handle error conditions or invalid inputs gracefully.</li>
                  <li>Experiment with alternative approaches to deepen your understanding.</li>
                </ul>
                <p className="mt-2">
                  Click "Run Code" to execute your solution and view the output. If errors occur, check the line numbers and debug accordingly. Resize the editor by dragging its bottom edge.
                </p>
              </div>
            </div>
            <nav className="border-b border-gray-200 dark:border-slate-700 mb-4">
              <div className="flex" role="tablist" aria-label="Editor programming languages">
                {["java", "cpp", "python"].map((lang) => (
                  <button
                    key={lang}
                    role="tab"
                    aria-selected={activeTab === lang}
                    aria-controls={`editor-panel-${lang}`}
                    id={`editor-tab-${lang}`}
                    onClick={() => setActiveTab(lang)}
                    className={`px-4 py-2 font-medium text-sm focus:outline-none transition-colors ${
                      activeTab === lang
                        ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 bg-indigo-50 dark:bg-slate-700"
                        : "text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-slate-700"
                    }`}
                  >
                    {lang.toUpperCase()}
                  </button>
                ))}
              </div>
            </nav>
            <MonacoEditor
              height="400px"
              minHeight="300px"
              maxHeight="600px"
              language={activeTab}
              theme="vs-dark"
              value={editorCode}
              onChange={(value) => setEditorCode(value)}
              options={{
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 14,
                automaticLayout: true,
                wordWrap: "on",
                resize: "vertical",
              }}
            />
            <div className="flex justify-end mt-4 gap-4">
              <button
                onClick={handleRunCode}
                disabled={isSubmitting}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-800 dark:to-blue-900 text-white rounded-lg shadow-md hover:scale-105 disabled:opacity-50 transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {isSubmitting ? "Running..." : "Run Code"}
              </button>
            </div>
            {executionResult && (
              <div className="mt-4 p-4 bg-gray-100 dark:bg-slate-700 rounded-lg">
                <h3 className="font-semibold mb-2">Execution Result:</h3>
                <p>Status: {executionResult.status}</p>
                {executionResult.stdout && (
                  <pre className="mt-2 p-2 bg-gray-200 dark:bg-slate-600 rounded">
                    {executionResult.stdout}
                  </pre>
                )}
                {executionResult.stderr && (
                  <pre className="mt-2 p-2 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded">
                    {executionResult.line ? `Error at line ${executionResult.line}:\n` : ""}
                    {executionResult.stderr}
                  </pre>
                )}
              </div>
            )}
          </motion.section>

          {/* Navigation Buttons */}
          <motion.div
            className="flex justify-between mt-6"
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.6 }}
          >
            {prevId !== null && (
              <Link
                href={`/leetcode/${prevId}`}
                className="inline-flex items-center px-4 py-2 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg shadow-md hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors duration-200"
              >
                Previous Question
              </Link>
            )}
            <Link
              href={`/leetcode/${nextId}`}
              className="inline-flex items-center px-4 py-2 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg shadow-md hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors duration-200"
            >
              Next Question
            </Link>
          </motion.div>
        </motion.article>
      </main>
    </Layout>
  );
});

export default ProblemPage;