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
import { ChevronLeftIcon } from "@heroicons/react/24/solid";

export default function SystemDesignArticle({ frontmatter, content, relatedQuestions }) {
  const router = useRouter();
  const { id } = router.query;

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "Beginner":
        return "bg-green-500";
      case "Intermediate":
        return "bg-yellow-500";
      case "Advanced":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <Layout>
      <Head>
        <title>{`${frontmatter.title} | SystemDesignGuide`}</title>
        <meta
          name="description"
          content={`Detailed system design guide for ${frontmatter.title}, covering microservices, caching, load balancing, and more.`}
        />
        <meta
          name="keywords"
          content={`system design, ${frontmatter.title}, ${frontmatter.difficulty}, ${frontmatter.tags.join(", ")}, microservices, caching, scalability`}
        />
        <meta name="author" content="SystemDesignGuide Team" />
        <meta name="robots" content="index, follow" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta
          property="og:title"
          content={`${frontmatter.title} | SystemDesignGuide`}
        />
        <meta
          property="og:description"
          content={`Learn how to design ${frontmatter.title} with a comprehensive guide on architecture, microservices, and scalability.`}
        />
        <meta property="og:type" content="article" />
        <meta
          property="og:url"
          content={`https://devexplained.vercel.app/system-design/${id}`}
        />
        <meta
          property="og:image"
          content="https://devexplained.vercel.app/og-image.jpg"
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content={`${frontmatter.title} | SystemDesignGuide`}
        />
        <meta
          name="twitter:description"
          content={`Explore the system design of ${frontmatter.title} with detailed architecture and implementation.`}
        />
        <meta
          name="twitter:image"
          content="https://devexplained.vercel.app/twitter-image.jpg"
        />
        <link
          rel="canonical"
          href={`https://devexplained.vercel.app/system-design/${id}`}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(
              JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Article",
                "headline": frontmatter.title,
                "description": `Detailed system design guide for ${frontmatter.title}.`,
                "keywords": frontmatter.tags.join(", "),
                "author": {
                  "@type": "Organization",
                  "name": "SystemDesignGuide Team",
                },
                "datePublished": "2025-04-16",
                "mainEntityOfPage": {
                  "@type": "WebPage",
                  "@id": `https://devexplained.vercel.app/system-design/${id}`,
                },
              })
            ),
          }}
        />
      </Head>
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
              className="flex items-center text-indigo-600 dark:text-indigo-400 hover:underline text-sm"
              aria-label="Back to System Design Questions"
            >
              <ChevronLeftIcon className="w-4 h-4 mr-1" />
              Back to System Design Questions
            </Link>
          </nav>

          {/* Article Header */}
          <header className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              {frontmatter.title}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`px-4 py-1.5 rounded-full text-sm font-medium text-white ${getDifficultyColor(
                  frontmatter.difficulty
                )}`}
              >
                {frontmatter.difficulty}
              </span>
              {frontmatter.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/system-design?tag=${encodeURIComponent(tag)}`}
                  className="px-4 py-1.5 rounded-full text-sm bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                  aria-label={`Filter by ${tag} tag`}
                >
                  {tag}
                </Link>
              ))}
            </div>
          </header>

          {/* Article Content and Sidebar */}
          <div className="flex flex-col lg:flex-row gap-8">
            <article className="lg:w-3/4 prose dark:prose-invert max-w-none bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 sm:ml-0 md:ml-0 lg:ml-0 xl:ml-0">
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
                      <pre className={`${blockClass} rounded-lg p-4 overflow-x-auto font-mono text-sm sm:ml-[-1rem] md:ml-[-1rem] lg:ml-0 xl:ml-0`}>
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
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 sticky top-6"
              >
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                  Related Questions
                </h3>
                <ul className="space-y-3">
                  {relatedQuestions.length > 0 ? (
                    relatedQuestions.map((q) => (
                      <li key={q.id}>
                        <Link
                          key={q.id}
                          href={`/system-design/${q.id}`}
                          className="text-indigo-600 dark:text-indigo-400 hover:underline text-base"
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
    // Use design_[id]_blog.md naming convention
    const filePath = path.join(process.cwd(), "system_design_blogs", `design_${params?.id}_blog.md`);
    const fileContent = fs.readFileSync(filePath, "utf8");
    const { data: frontmatter, content } = matter(fileContent);

    // Find related questions based on shared tags
    const currentQuestion = questions.find((q) => q.id === params?.id);
    const relatedQuestions = questions
      .filter(
        (q) =>
          q.id !== params?.id &&
          q.tags.some((tag) => currentQuestion?.tags.includes(tag))
      )
      .slice(0, 5)
      .map((q) => ({ id: q.id, title: q.title }));

    // Fallback to JSON metadata if frontmatter is incomplete
    return {
      props: {
        frontmatter: {
          title: frontmatter.title || currentQuestion?.title || "Untitled",
          difficulty: frontmatter.difficulty || currentQuestion?.difficulty || "Unknown",
          tags: frontmatter.tags || currentQuestion?.tags || [],
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