import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/router";
import problems from "../../data/problems.json";
import Link from "next/link";
import { motion } from "framer-motion";
import Layout from "../../components/Layout";
import Dropdown from "../../components/Dropdown";
import Head from "next/head";

export default function Leetcode() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [tag, setTag] = useState("");
  const [jumpPage, setJumpPage] = useState("");

  // Handle tag query parameter
  useEffect(() => {
    if (router.query.tag) {
      const queryTag = decodeURIComponent(router.query.tag);
      setTag(queryTag);
      setPage(1);
    } else {
      setTag("");
    }
  }, [router.query.tag]);

  const updateQuery = (newQuery) => {
    router.push({
      pathname: router.pathname,
      query: newQuery,
    }, undefined, { shallow: true });
  };

  const handleClearFilter = (filterType) => {
    const newQuery = { ...router.query };
    delete newQuery[filterType];
    updateQuery(newQuery);
  };

  const allTags = useMemo(() => {
    const tags = new Set();
    problems.forEach((p) => p.tags?.forEach((t) => tags.add(t)));
    return ["All", ...Array.from(tags).sort()];
  }, []);

  const tagCounts = useMemo(() => {
    const counts = {};
    problems.forEach((p) =>
      p.tags?.forEach((t) => (counts[t] = (counts[t] || 0) + 1))
    );
    return counts;
  }, []);

  const filtered = useMemo(() => {
    let result = problems;
    if (search) {
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(search.toLowerCase()) || p.id === search
      );
    }
    if (difficulty && difficulty !== "All") {
      result = result.filter((p) => p.difficulty === difficulty);
    }
    if (tag && tag !== "All") {
      result = result.filter((p) =>
        p.tags?.some((t) => t.toLowerCase() === tag.toLowerCase())
      );
    }
    return result;
  }, [search, difficulty, tag]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  // Animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  const difficultyVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: (difficulty) => ({
      scale: 1,
      opacity: 1,
      transition: {
        duration: 0.5,
        type: "spring",
        stiffness: 100,
      },
    }),
  };

  const handleJumpPage = (e) => {
    if (e.key === "Enter" && jumpPage) {
      const newPage = Math.max(1, Math.min(Number(jumpPage), totalPages));
      setPage(newPage);
      setJumpPage("");
    }
  };

  return (
    <Layout>
      <Head>
        <title>
          {`Leetcode Solutions - ${search || "All"} Problems | LeetcodeSolve`}
        </title>
        <meta
          name="description"
          content={`Find solutions to ${search || "all"} Leetcode problems with expert tutorials in C++ and Python. Filter by ${difficulty || "all difficulties"} and ${tag || "all tags"} on LeetcodeSolve.`}
        />
        <meta
          name="keywords"
          content={`Leetcode solutions, coding problems, ${difficulty || "easy medium hard"}, ${tag || "all tags"}, algorithms, data structures, C++, Python, coding tutorials`}
        />
        <meta name="author" content="LeetcodeSolve Team" />
        <meta name="robots" content="index, follow" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta
          property="og:title"
          content={`Leetcode Solutions - ${search || "All"} Problems | LeetcodeSolve`}
        />
        <meta
          property="og:description"
          content={`Explore ${search || "all"} Leetcode problems with solutions, tutorials, and filters for ${difficulty || "all difficulties"} and ${tag || "all tags"}.`}
        />
        <meta property="og:type" content="website" />
        <meta
          property="og:url"
          content={`https://devexplained.vercel.app/leetcode${
            tag ? `?tag=${encodeURIComponent(tag)}` : ""
          }`}
        />
        <meta
          property="og:image"
          content="https://devexplained.vercel.app/og-image.jpg"
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content={`Leetcode Solutions - ${search || "All"} Problems | LeetcodeSolve`}
        />
        <meta
          name="twitter:description"
          content={`Level up with ${search || "all"} Leetcode solutions filtered by ${difficulty || "all difficulties"} and ${tag || "all tags"}.`}
        />
        <meta
          name="twitter:image"
          content="https://devexplained.vercel.app/twitter-image.jpg"
        />
        <link
          rel="canonical"
          href={`https://devexplained.vercel.app/leetcode${
            tag ? `?tag=${encodeURIComponent(tag)}` : ""
          }`}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ItemList",
              "url": `https://devexplained.vercel.app/leetcode${
                tag ? `?tag=${encodeURIComponent(tag)}` : ""
              }`,
              "name": `Leetcode ${search || "all"} problems`,
              "description": `Find solutions to ${search || "all"} Leetcode problems with expert tutorials.`,
              "itemListElement": filtered.map((p, index) => ({
                "@type": "ListItem",
                "position": index + 1,
                "url": `https://devexplained.vercel.app/leetcode/${p.id}`,
                "name": `${p.id}. ${p.title}`,
                "description": `Difficulty: ${p.difficulty}, Tags: ${p.tags?.join(", ")}`,
              })),
            }),
          }}
        />
      </Head>

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 py-12">
        {/* Filters */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full mb-10 bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6"
        >
          <div className="flex flex-col sm:flex-row flex-wrap gap-4">
            <input
              type="text"
              placeholder="Search by title or ID..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="h-12 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 px-5 py-2 rounded-full w-full sm:w-80 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base shadow-md hover:shadow-lg transition"
              aria-label="Search problems"
            />
            <Dropdown
              options={["All", "Easy", "Medium", "Hard"]}
              value={difficulty}
              onChange={(val) => {
                setDifficulty(val);
                setPage(1);
                if (val === "All") {
                  handleClearFilter("difficulty");
                } else {
                  updateQuery({ ...router.query, difficulty: val });
                }
              }}
              label="Filter by difficulty"
              placeholder="Select difficulty"
              className="w-full sm:w-48"
              buttonClassName="h-12 text-base"
              clearable={difficulty !== "" && difficulty !== "All"}
              size="lg"
              placement="bottom"
            />
            <Dropdown
              options={allTags}
              value={tag}
              onChange={(val) => {
                setTag(val);
                setPage(1);
                if (val === "All") {
                  handleClearFilter("tag");
                } else {
                  updateQuery({ ...router.query, tag: val });
                }
              }}
              label="Filter by tag"
              placeholder="Select tag"
              className="w-full sm:w-48"
              buttonClassName="h-12 text-base"
              clearable={tag !== "" && tag !== "All"}
              size="lg"
              placement="bottom"
            />
            <Dropdown
              options={[
                { value: "10", label: "10 / page" },
                { value: "25", label: "25 / page" },
                { value: "50", label: "50 / page" },
                { value: "100", label: "100 / page" },
                { value: "500", label: "500/ page" },
              ]}
              value={String(perPage)}
              onChange={(val) => {
                setPerPage(Number(val));
                setPage(1);
              }}
              label="Items per page"
              placeholder="Select items per page"
              className="w-full sm:w-40"
              buttonClassName="h-12 text-base"
              size="lg"
              placement="bottom"
            />
          </div>
        </motion.div>

        {/* Main Content and Sidebar */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Problem List */}
          <div className="w-full lg:w-3/4">
            <ul className="space-y-6">
              {paginated.length === 0 ? (
                <li className="text-center text-gray-500 dark:text-gray-400 py-10">
                  No problems found. Try adjusting your filters.
                </li>
              ) : (
                paginated.map(({ id, title, difficulty: diff, tags }) => (
                  <motion.li
                    key={id}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    className="border rounded-xl p-6 bg-white dark:bg-slate-800 shadow-lg hover:shadow-xl transition transform hover:-translate-y-2 cursor-pointer"
                    whileHover={{ scale: 1.02 }}
                    onClick={() => router.push(`/leetcode/${id}`)}
                  >
                    <div className="flex flex-col">
                      <Link
                        href={`/leetcode/${id}`}
                        className="text-xl font-semibold text-indigo-600 dark:text-indigo-400 hover:underline mb-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {id}. {title}
                      </Link>
                      <div className="flex items-center mt-2">
                        <motion.div
                          initial="hidden"
                          animate="visible"
                          variants={difficultyVariants}
                          custom={diff}
                          className="cursor-pointer"
                          whileHover={{ scale: 0.98 }}
                        >
                          <span
                            className="px-3 py-1 rounded-full text-white text-sm font-medium"
                            style={{
                              backgroundColor:
                                diff === "Easy"
                                  ? "#34D399"
                                  : diff === "Medium"
                                  ? "#FBBF24"
                                  : "#EF4444",
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setDifficulty(diff);
                              setPage(1);
                            }}
                          >
                            {diff}
                          </span>
                        </motion.div>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {tags?.map((t, i) => (
                          <Link
                            key={i}
                            href={`/leetcode/tags/${t}`}
                            className="text-sm bg-gray-100 dark:bg-slate-700 px-3 py-1 rounded-full hover:bg-gray-200 dark:hover:bg-slate-600 transition"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {t}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </motion.li>
                ))
              )}
            </ul>
          </div>

          {/* Tag Sidebar */}
          <aside className="w-full lg:w-1/4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 sticky top-6 max-h-[calc(100vh-300px)] overflow-y-auto"
            >
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                Popular Topics
              </h3>
              <ul className="space-y-3">
                {allTags.map((t) => (
                  t !== "All" && (
                    <li key={t}>
                      <Link
                        href={`/leetcode?tag=${encodeURIComponent(t)}`}
                        className="text-indigo-600 dark:text-indigo-400 hover:underline flex justify-between items-center"
                        onClick={() => {
                          setTag(t);
                          setPage(1);
                        }}
                      >
                        <span>{t}</span>
                        <span className="text-gray-500 dark:text-gray-400 text-sm">
                          ({tagCounts[t] || 0})
                        </span>
                      </Link>
                    </li>
                  )
                ))}
              </ul>
            </motion.div>
          </aside>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex justify-center items-center gap-6 mt-12"
          >
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="px-5 py-2 border border-gray-300 dark:border-slate-600 rounded-full text-base disabled:opacity-50 hover:bg-indigo-50 dark:hover:bg-slate-700 transition focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-md hover:shadow-lg"
              aria-label="Previous page"
            >
              Prev
            </button>
            <span className="text-base text-gray-600 dark:text-gray-300">
              Page {page} of {totalPages}
            </span>
            <input
              type="number"
              value={jumpPage}
              onChange={(e) => setJumpPage(e.target.value)}
              onKeyPress={handleJumpPage}
              min="1"
              max={totalPages}
              className="w-16 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-full text-base bg-white dark:bg-slate-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-md hover:shadow-lg"
              placeholder="Jump to"
              aria-label="Jump to page"
            />
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              className="px-5 py-2 border border-gray-300 dark:border-slate-600 rounded-full text-base disabled:opacity-50 hover:bg-indigo-50 dark:hover:bg-slate-700 transition focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-md hover:shadow-lg"
              aria-label="Next page"
            >
              Next
            </button>
          </motion.div>
        )}
      </main>
    </Layout>
  );
}