import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/router";
import problems from "../../data/problems.json";
import Link from "next/link";
import { motion } from "framer-motion";
import Layout from "../../components/Layout";

export default function Leetcode() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("All");
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [tag, setTag] = useState("All");

  // Handle tag query parameter
  useEffect(() => {
    if (router.query.tag) {
      const queryTag = decodeURIComponent(router.query.tag);
      setTag(queryTag);
      setPage(1);
    }
  }, [router.query.tag]);

  const allTags = useMemo(() => {
    const tags = new Set();
    problems.forEach((p) => p.tags?.forEach((t) => tags.add(t)));
    return ["All", ...Array.from(tags).sort()];
  }, []);

  const filtered = useMemo(() => {
    let result = problems;
    if (search) {
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(search.toLowerCase()) ||
          p.id === search
      );
    }
    if (difficulty !== "All") {
      result = result.filter((p) => p.difficulty === difficulty);
    }
    if (tag !== "All") {
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

  return (
    <Layout>
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Filters */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row flex-wrap gap-4 mb-8 bg-white dark:bg-slate-800 rounded-xl shadow-md p-4"
        >
          <input
            type="text"
            placeholder="Search by title or ID..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 px-4 py-2 rounded-full w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm sm:text-base"
            aria-label="Search problems"
          />
          <select
            value={difficulty}
            onChange={(e) => {
              setDifficulty(e.target.value);
              setPage(1);
            }}
            className="border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 px-4 py-2 rounded-full w-full sm:w-40 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm sm:text-base"
            aria-label="Filter by difficulty"
          >
            <option>All</option>
            <option>Easy</option>
            <option>Medium</option>
            <option>Hard</option>
          </select>
          <select
            value={tag}
            onChange={(e) => {
              setTag(e.target.value);
              setPage(1);
            }}
            className="border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 px-4 py-2 rounded-full w-full sm:w-40 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm sm:text-base"
            aria-label="Filter by tag"
          >
            {allTags.map((t, i) => (
              <option key={i} value={t}>
                {t}
              </option>
            ))}
          </select>
          <select
            value={perPage}
            onChange={(e) => {
              setPerPage(Number(e.target.value));
              setPage(1);
            }}
            className="border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 px-4 py-2 rounded-full w-full sm:w-32 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm sm:text-base"
            aria-label="Items per page"
          >
            <option value={10}>10 / page</option>
            <option value={25}>25 / page</option>
            <option value={50}>50 / page</option>
          </select>
        </motion.div>

        {/* Problem List */}
        <ul className="space-y-4">
          {paginated.map(({ id, title, difficulty, tags }) => (
            <motion.li
              key={id}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              className="border rounded-xl p-4 sm:p-6 bg-white dark:bg-slate-800 shadow-md hover:shadow-lg transition transform hover:-translate-y-1"
            >
              <Link
                href={`/leetcode/${id}`}
                className="text-lg sm:text-xl font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                {id}. {title}
              </Link>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{difficulty}</div>
              <div className="flex flex-wrap gap-2 mt-2">
                {tags?.map((tag, i) => (
                  <Link
                    key={i}
                    href={`/leetcode/tags/${tag}`}
                    className="text-xs bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded-full hover:bg-gray-200 dark:hover:bg-slate-600 transition"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            </motion.li>
          ))}
        </ul>

        {/* Pagination */}
        {totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex justify-center items-center gap-2 sm:gap-4 mt-8"
          >
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-full text-sm sm:text-base disabled:opacity-50 hover:bg-indigo-50 dark:hover:bg-slate-700 transition focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label="Previous page"
            >
              Prev
            </button>
            <span className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-full text-sm sm:text-base disabled:opacity-50 hover:bg-indigo-50 dark:hover:bg-slate-700 transition focus:outline-none focus:ring-2 focus:ring-indigo-500"
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