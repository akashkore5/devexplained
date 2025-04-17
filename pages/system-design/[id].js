import { useRouter } from "next/router";
import Link from "next/link";
import Layout from "../../components/Layout";
import Head from "next/head";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion } from "framer-motion";
import DOMPurify from "isomorphic-dompurify";
import questions from "../../data/system_design_questions.json";
import { ChevronLeftIcon, CheckCircleIcon, HeartIcon } from "@heroicons/react/24/solid";
import { useState, useCallback, useEffect } from "react";
import { Toaster, toast } from "react-hot-toast";
import { useSession } from "next-auth/react";

export default function SystemDesignArticle({ frontmatter, content, relatedQuestions }) {
  const router = useRouter();
  const { id } = router.query;
  const { data: session, status } = useSession();
  const [isSolving, setIsSolving] = useState(false);
  const [isTagging, setIsTagging] = useState(false);
  const [isSolved, setIsSolved] = useState(false);
  const [isTagged, setIsTagged] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "Beginner":
        return "bg-gradient-to-r from-green-500 to-green-600 dark:from-green-700 dark:to-green-800";
      case "Intermediate":
        return "bg-gradient-to-r from-yellow-500 to-yellow-600 dark:from-yellow-700 dark:to-yellow-800";
      case "Advanced":
        return "bg-gradient-to-r from-red-500 to-red-600 dark:from-red-700 dark:to-red-800";
      default:
        return "bg-gradient-to-r from-gray-500 to-gray-600 dark:from-gray-700 dark:to-gray-800";
    }
  };

  // Fetch solved and tagged status
  useEffect(() => {
    if (status !== "authenticated" || !id) return;

    const fetchProgress = async () => {
      try {
        const response = await fetch("/api/user/progress/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "systemdesign", action: "all" }),
        });
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        const data = await response.json();
        console.log("Progress API response:", data);
        if (!data || typeof data !== "object") {
          throw new Error("Invalid API response");
        }
        const numericId = Number(id);
        setIsSolved((data.solved || []).includes(numericId));
        setIsTagged((data.tagged || []).includes(numericId));
      } catch (error) {
        console.error("Error fetching progress:", error);
        toast.error("Failed to load progress");
      }
    };

    fetchProgress();
  }, [id, status]);

  // Mark article as viewed (only for logged-in users)
  useEffect(() => {
    if (status !== "authenticated" || !id) return;

    const checkAndMarkViewed = async () => {
      try {
        const numericId = Number(id);
        const response = await fetch("/api/user/progress/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "systemdesign", action: "viewed", id: numericId }),
        });
        const data = await response.json();
        if (data.isPresent) return;

        const markResponse = await fetch("/api/user/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "systemdesign", action: "viewed", id: numericId }),
        });
        if (!markResponse.ok) {
          console.error("Failed to mark viewed:", markResponse.statusText);
        }
      } catch (error) {
        console.error("Error checking/marking viewed:", error);
      }
    };

    checkAndMarkViewed();
  }, [id, status]);

  const handleMarkSolved = useCallback(async () => {
    if (status !== "authenticated") {
      setIsLoginModalOpen(true);
      return;
    }

    const numericId = Number(id);
    const willRemove = isSolved;
    setIsSolving(true);
    try {
      const response = await fetch("/api/user/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "systemdesign",
          action: "solved",
          id: numericId,
          remove: willRemove,
        }),
      });
      if (response.ok) {
        setIsSolved(!willRemove);
        toast.success(willRemove ? "Article unmarked as solved!" : "Article marked as solved!");
      } else {
        toast.error("Failed to update solved status");
      }
    } catch (error) {
      console.error("Error updating solved status:", error);
      toast.error("An error occurred");
    } finally {
      setIsSolving(false);
    }
  }, [id, status, isSolved]);

  const handleLikeTag = useCallback(async () => {
    if (status !== "authenticated") {
      setIsLoginModalOpen(true);
      return;
    }

    const numericId = Number(id);
    const willRemove = isTagged;
    setIsTagging(true);
    try {
      const response = await fetch("/api/user/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "systemdesign",
          action: "tagged",
          id: numericId,
          remove: willRemove,
        }),
      });
      if (response.ok) {
        setIsTagged(!willRemove);
        toast.success(willRemove ? "Article untagged!" : "Article tagged!");
      } else {
        toast.error("Failed to update tag status");
      }
    } catch (error) {
      console.error("Error updating tag status:", error);
      toast.error("An error occurred");
    } finally {
      setIsTagging(false);
    }
  }, [id, status, isTagged]);

  return (
    <Layout
      title={`${frontmatter.title} | LeetcodeSolve`}
      description={`Detailed system design guide for ${frontmatter.title}, covering microservices, caching, load balancing, and more.`}
      isLoginModalOpen={isLoginModalOpen}
      setIsLoginModalOpen={setIsLoginModalOpen}
    >
      <Head>
        <meta
          name="keywords"
          content={`system design, ${frontmatter.title}, ${frontmatter.difficulty}, ${frontmatter.tags.join(", ")}, microservices, caching, scalability`}
        />
        <meta name="author" content="LeetcodeSolve Team" />
        <meta name="robots" content="index, follow" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta
          property="og:title"
          content={`${frontmatter.title} | LeetcodeSolve`}
        />
        <meta
          property="og:description"
          content={`Learn how to design ${frontmatter.title} with a comprehensive guide on architecture, microservices, and scalability.`}
        />
        <meta property="og:type" content="article" />
        <meta
          property="og:url"
          content={`https://leetcodesolve.vercel.app/system-design/${id}`}
        />
        <meta
          property="og:image"
          content="https://leetcodesolve.vercel.app/og-image.jpg"
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content={`${frontmatter.title} | LeetcodeSolve`}
        />
        <meta
          name="twitter:description"
          content={`Explore the system design of ${frontmatter.title} with detailed architecture and implementation.`}
        />
        <meta
          name="twitter:image"
          content="https://leetcodesolve.vercel.app/twitter-image.jpg"
        />
        <link
          rel="canonical"
          href={`https://leetcodesolve.vercel.app/system-design/${id}`}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(
              JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Article",
                headline: frontmatter.title,
                description: `Detailed system design guide for ${frontmatter.title}.`,
                keywords: frontmatter.tags.join(", "),
                author: {
                  "@type": "Organization",
                  "name": "LeetcodeSolve Team",
                },
                datePublished: frontmatter.date || "2025-04-16",
                mainEntityOfPage: {
                  "@type": "WebPage",
                  "@id": `https://leetcodesolve.vercel.app/system-design/${id}`,
                },
              })
            ),
          }}
        />
      </Head>
      <Toaster />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Breadcrumb */}
          <nav className="mb-6">
            <Link
              href="/system-design"
              className="flex items-center text-indigo-600 dark:text-indigo-400 hover:underline text-sm font-medium"
              aria-label="Back to System Design Questions"
            >
              <ChevronLeftIcon className="w-4 h-4 mr-1" />
              Back to System Design Questions
            </Link>
          </nav>

          {/* Article Header */}
          <header className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-6">
              {frontmatter.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4">
              <span
                className={`px-4 py-2 rounded-full text-sm font-semibold text-white ${getDifficultyColor(
                  frontmatter.difficulty
                )} shadow-md`}
              >
                {frontmatter.difficulty}
              </span>
              {frontmatter.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/system-design?tag=${encodeURIComponent(tag)}`}
                  className="px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 rounded-full text-sm font-medium hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors duration-200"
                  aria-label={`Filter by ${tag} tag`}
                >
                  {tag}
                </Link>
              ))}
              <motion.button
                onClick={handleMarkSolved}
                disabled={isSolving}
                className={`flex items-center px-4 py-2 rounded-lg shadow-md transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  isSolved
                    ? "bg-green-500 text-white hover:bg-green-600"
                    : "bg-gradient-to-r from-indigo-600 to-indigo-700 dark:from-indigo-800 dark:to-indigo-900 text-white hover:scale-105"
                } ${isSolving ? "opacity-50 cursor-not-allowed" : ""}`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label={isSolved ? "Unmark as solved" : "Mark as solved"}
              >
                <CheckCircleIcon className="w-5 h-5 mr-2" />
                {isSolving ? "Processing..." : isSolved ? "Unmark Solved" : "Mark as Solved"}
              </motion.button>
              <motion.button
                onClick={handleLikeTag}
                disabled={isTagging}
                className={`flex items-center px-4 py-2 rounded-lg shadow-md transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                  isTagged
                    ? "bg-green-500 text-white hover:bg-green-600"
                    : "bg-gradient-to-r from-pink-600 to-pink-700 dark:from-pink-800 dark:to-pink-900 text-white hover:scale-105"
                } ${isTagging ? "opacity-50 cursor-not-allowed" : ""}`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label={isTagged ? "Untag article" : "Tag article"}
              >
                <HeartIcon className="w-5 h-5 mr-2" />
                {isTagging ? "Processing..." : isTagged ? "Untag" : "Tag"}
              </motion.button>
            </div>
          </header>

          {/* Article Content and Sidebar */}
          <div className="flex flex-col lg:flex-row gap-8">
            <article className="lg:w-3/4 prose dark:prose-invert max-w-none bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ node, inline, className = "", children, ...props }) {
                    const content = String(children).trim();
                    const isAscii = content.includes("──") || content.includes("│") || content.includes("┌");
                    const isSql = className.includes("language-sql") || content.toLowerCase().startsWith("create table");
                    const isSpec = className.includes("language-yaml") || className.includes("language-json") || content.includes("spec:");
                    const blockClass = isAscii
                      ? "bg-gray-200 dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700"
                      : isSql
                      ? "bg-blue-50 dark:bg-blue-950 text-blue-900 dark:text-blue-200 border border-blue-200 dark:border-blue-800"
                      : isSpec
                      ? "bg-purple-50 dark:bg-purple-950 text-purple-900 dark:text-purple-200 border border-purple-200 dark:border-purple-800"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100";

                    return inline ? (
                      <code className="bg-gray-100 dark:bg-gray-700 rounded px-1 py-0.5 text-gray-900 dark:text-gray-100" {...props}>
                        {children}
                      </code>
                    ) : (
                      <pre className={`${blockClass} rounded-lg p-4 overflow-x-auto font-mono text-sm`}>
                        <code className={className} {...props}>
                          {children}
                        </code>
                      </pre>
                    );
                  },
                  h2: ({ children }) => (
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-4">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-6 mb-3">
                      {children}
                    </h3>
                  ),
                }}
              >
                {content}
              </ReactMarkdown>
            </article>

            {/* Sidebar */}
            <aside className="lg:w-1/4">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 sticky top-6"
              >
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                  Related Questions
                </h3>
                <ul className="space-y-3">
                  {relatedQuestions.length > 0 ? (
                    relatedQuestions.map((q) => (
                      <li key={q.id}>
                        <Link
                          href={`/system-design/${q.id}`}
                          className="text-indigo-600 dark:text-indigo-400 hover:underline text-base font-medium"
                          aria-label={`View ${q.title}`}
                        >
                          {q.title}
                        </Link>
                      </li>
                    ))
                  ) : (
                    <li className="text-gray-500 dark:text-gray-400 text-sm">
                      No related questions found.
                    </li>
                  )}
                </ul>
              </motion.div>
            </aside>
          </div>
        </motion.div>
      </main>
    </Layout>
  );
}

export async function getStaticPaths() {
  const paths = questions.map((q) => ({
    params: { id: q.id },
  }));
  return { paths, fallback: false };
}

export async function getStaticProps({ params }) {
  try {
    const filePath = path.join(process.cwd(), "system_design_blogs", `design_${params?.id}_blog.md`);
    const fileContent = fs.readFileSync(filePath, "utf8");
    const { data: frontmatter, content } = matter(fileContent);

    const currentQuestion = questions.find((q) => q.id === params?.id);
    const relatedQuestions = questions
      .filter(
        (q) =>
          q.id !== params?.id &&
          q.tags.some((tag) => currentQuestion?.tags.includes(tag))
      )
      .slice(0, 5)
      .map((q) => ({ id: q.id, title: q.title }));

    return {
      props: {
        frontmatter: {
          title: frontmatter.title || currentQuestion?.title || "Untitled",
          difficulty: frontmatter.difficulty || currentQuestion?.difficulty || "Unknown",
          tags: frontmatter.tags || currentQuestion?.tags || [],
          date: frontmatter.date || currentQuestion?.date || null,
        },
        content,
        relatedQuestions,
      },
    };
  } catch (error) {
    console.error(`Error loading system design blog for ID ${params?.id}:`, error);
    return {
      notFound: true,
    };
  }
}