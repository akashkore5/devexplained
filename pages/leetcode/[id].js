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

  const langs = ["java", "cpp", "python"];
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
  const [activeTab, setActiveTab] = useState("java");
  const [copyIcon, setCopyIcon] = useState("copy");
  const codeRef = useRef(null);
  const router = useRouter();

  // Calculate next and previous IDs
  const currentId = parseInt(frontMatter.id, 10);
  const nextId = currentId + 1;
  const prevId = currentId > 1 ? currentId - 1 : null;

  // Sanitize HTML content
  const sanitizedContentHtml = useMemo(() => {
    return purify.sanitize(contentHtml, { USE_PROFILES: { html: true } });
  }, [contentHtml]);

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

  // Structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `${frontMatter.id}. ${frontMatter.title || "Leetcode Solution"}`,
    description: `Detailed solution for Leetcode problem ${frontMatter.title || "Untitled Problem"} with explanations and code in Java, C++, and Python.`,
    keywords: `Leetcode, ${frontMatter.title}, coding, algorithms, ${frontMatter.difficulty || "programming"}, Java, C++, Python, coding interview`,
    author: {
      "@type": "Organization",
      name: "LeetcodeSolve Team",
    },
    publisher: {
      "@type": "Organization",
      name: "LeetcodeSolve",
      logo: {
        "@type": "ImageObject",
        url: "https://devexplained.vercel.app/logo.png",
      },
    },
    datePublished: frontMatter.date || new Date().toISOString(),
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://devexplained.vercel.app/leetcode/${frontMatter.id}`,
    },
    image: "https://devexplained.vercel.app/og-image.jpg",
  };

  return (
    <Layout>
      <Head>
        <title>{`${frontMatter.id}. ${frontMatter.title || "Leetcode Solution"} - LeetcodeSolve`}</title>
        <meta
          name="description"
          content={`Master the ${frontMatter.title || "Leetcode problem"} with detailed solutions in Java, C++, and Python. Includes explanations, complexity analysis, and interview tips.`}
        />
        <meta
          name="keywords"
          content={`Leetcode, ${frontMatter.title}, ${frontMatter.difficulty || "programming"}, Java, C++, Python, algorithms, data structures, coding interview, Leetcode solution`}
        />
        <meta name="author" content="LeetcodeSolve Team" />
        <meta name="robots" content="index, follow" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta
          property="og:title"
          content={`${frontMatter.id}. ${frontMatter.title || "Leetcode Solution"} - LeetcodeSolve`}
        />
        <meta
          property="og:description"
          content={`Detailed solution for Leetcode problem ${frontMatter.title || "Untitled Problem"} with code in Java, C++, and Python, plus expert explanations.`}
        />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`https://devexplained.vercel.app/leetcode/${frontMatter.id}`} />
        <meta property="og:image" content="https://devexplained.vercel.app/og-image.jpg" />
        <meta property="og:image:alt" content={`Leetcode ${frontMatter.title} solution preview`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content={`${frontMatter.id}. ${frontMatter.title || "Leetcode Solution"} - LeetcodeSolve`}
        />
        <meta
          name="twitter:description"
          content={`Learn how to solve Leetcode's ${frontMatter.title || "problem"} with our expert solutions in Java, C++, and Python.`}
        />
        <meta name="twitter:image" content="https://devexplained.vercel.app/twitter-image.jpg" />
        <meta name="twitter:image:alt" content={`Leetcode ${frontMatter.title} solution preview`} />
        <link rel="canonical" href={`https://devexplained.vercel.app/leetcode/${frontMatter.id}`} />
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="theme-color" content="#4f46e5" />
        <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
        <meta name="google-site-verification" content="your-google-verification-code" />
        <meta name="bing-site-verification" content="your-bing-verification-code" />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Head>
      <Toaster />
      <article className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Problem Header */}
        <motion.header
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 sm:p-8 mb-6"
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-4">
            {frontMatter.id}. {frontMatter.title || "Untitled Problem"}
          </h1>
          <div className="flex items-center gap-4 flex-wrap">
            <button
              onClick={() => router.push(`/leetcode?difficulty=${frontMatter.difficulty}`)}
              className={`px-3 py-1 rounded-full text-sm font-medium ${difficultyStyle} cursor-pointer`}
              aria-label={`Filter by ${frontMatter.difficulty} difficulty`}
            >
              {frontMatter.difficulty || "Unknown"}
            </button>
            {frontMatter.tags?.map((tag) => (
              <Link
                key={tag}
                href={`/leetcode/tags/${tag}`}
                className="px-3 py-1 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 rounded-full text-sm hover:bg-gray-200 dark:hover:bg-slate-600 transition"
                prefetch={false}
              >
                {tag}
              </Link>
            ))}
          </div>
        </motion.header>

        {/* Problem Explanation */}
        <motion.section
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 sm:p-8 mb-6"
        >
          <div
            className="prose prose-gray dark:prose-invert max-w-none text-gray-700 dark:text-gray-200"
            dangerouslySetInnerHTML={{ __html: sanitizedContentHtml || "<p>No explanation available.</p>" }}
            aria-label="Problem explanation"
          />
          <div className="mt-4">
            <a
              href={`https://leetcode.com/problems/${frontMatter.title.replace(/\s+/g, '-').toLowerCase()}`}
              rel="noopener noreferrer"
              className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
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
          className="bg-white dark:bg-slate-800 rounded-xl shadow-md"
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

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          {prevId !== null && (
            <Link href={`/leetcode/${prevId}`} className="px-4 py-2 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-slate-600 transition">
              Previous Question
            </Link>
          )}
          <Link href={`/leetcode/${nextId}`} className="px-4 py-2 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-slate-600 transition">
            Next Question
          </Link>
        </div>
      </article>
    </Layout>
  );
});

export default ProblemPage;