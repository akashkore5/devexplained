import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import problems from "../../data/problems.json";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Layout from "../../components/Layout";
import Head from "next/head";
import { ChevronUpIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, XMarkIcon, DocumentTextIcon } from "@heroicons/react/24/solid";

export default function ProblemListTable() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [tag, setTag] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState(null);
  const [difficultyFilter, setDifficultyFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [isDifficultyOpen, setIsDifficultyOpen] = useState(false);
  const [isTagOpen, setIsTagOpen] = useState(false);
  const [isPerPageOpen, setIsPerPageOpen] = useState(false);

  const difficultyRef = useRef(null);
  const tagRef = useRef(null);
  const perPageRef = useRef(null);

  // Handle tag query parameter
  useEffect(() => {
    if (router.query.tag) {
      setTagFilter(decodeURIComponent(router.query.tag));
      setPage(1);
    } else {
      setTagFilter("");
    }
  }, [router.query.tag]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (difficultyRef.current && !difficultyRef.current.contains(event.target)) {
        setIsDifficultyOpen(false);
      }
      if (tagRef.current && !tagRef.current.contains(event.target)) {
        setIsTagOpen(false);
      }
      if (perPageRef.current && !perPageRef.current.contains(event.target)) {
        setIsPerPageOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const updateQuery = (newQuery) => {
    router.push({
      pathname: router.pathname,
      query: newQuery,
    }, undefined, { shallow: true });
  };

  const allTags = useMemo(() => {
    const tags = new Set();
    problems.forEach((p) => p.tags?.forEach((t) => tags.add(t)));
    return ["All", ...Array.from(tags).sort()];
  }, []);

  const filteredProblems = useMemo(() => {
    let result = problems;
    if (search) {
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(search.toLowerCase()) ||
          p.id.toString() === search
      );
    }
    if (difficultyFilter && difficultyFilter !== "All") {
      result = result.filter((p) => p.difficulty === difficultyFilter);
    }
    if (tagFilter && tagFilter !== "All") {
      result = result.filter((p) =>
        p.tags?.some((t) => t.toLowerCase() === tagFilter.toLowerCase())
      );
    }
    return result;
  }, [search, difficultyFilter, tagFilter]);

  const sortedProblems = useMemo(() => {
    if (!sortColumn || !sortDirection) {
      return [...filteredProblems]; // Original order (no sort)
    }
    return [...filteredProblems].sort((a, b) => {
      if (sortColumn === "title") {
        // Sort by id (numeric) for title column
        return sortDirection === "asc"
          ? Number(a.id) - Number(b.id)
          : Number(b.id) - Number(a.id);
      }
      // Sort by difficulty (string comparison)
      return sortDirection === "asc"
        ? String(a.difficulty).localeCompare(String(b.difficulty))
        : String(b.difficulty).localeCompare(String(a.difficulty));
    });
  }, [filteredProblems, sortColumn, sortDirection]);

  const totalPages = Math.ceil(sortedProblems.length / perPage);
  const paginatedProblems = sortedProblems.slice(
    (page - 1) * perPage,
    page * perPage
  );

  const handleSort = (column) => {
    if (sortColumn === column) {
      if (sortDirection === "asc") {
        setSortDirection("desc"); // Second click: descending
      } else if (sortDirection === "desc") {
        setSortColumn(null); // Third click: reset to no sort
        setSortDirection(null);
      } else {
        setSortDirection("asc"); // First click after reset: ascending
      }
    } else {
      setSortColumn(column);
      setSortDirection("asc"); // First click: ascending
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "Easy":
        return "bg-green-100 text-green-800 border-green-200";
      case "Medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Hard":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const handlePageChange = (newPage) => {
    setPage(Math.max(1, Math.min(newPage, totalPages)));
  };

  const clearFilter = (filterType) => {
    if (filterType === "search") {
      setSearch("");
      setPage(1);
    } else if (filterType === "difficulty") {
      setDifficultyFilter("");
      setPage(1);
      const newQuery = { ...router.query };
      delete newQuery.difficulty;
      updateQuery(newQuery);
    } else if (filterType === "tag") {
      setTagFilter("");
      setPage(1);
      const newQuery = { ...router.query };
      delete newQuery.tag;
      updateQuery(newQuery);
    } else if (filterType === "perPage") {
      setPerPage(10);
      setPage(1);
    }
  };

  // Truncate long dropdown values
  const truncateText = (text, maxLength = 20) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + "...";
  };

  return (
    <Layout>
      <Head>
        <title>Leetcode Problems Table | LeetcodeSolve</title>
        <meta
          name="description"
          content="Browse all Leetcode problems in a responsive, professional table with advanced filtering, sorting, and pagination."
        />
        <meta
          name="keywords"
          content="Leetcode problems, coding challenges, algorithms, data structures, programming tutorials"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 sm:flex-nowrap">
            <div className="relative flex-grow min-w-[150px] mb-3 sm:mb-0">
              <input
                type="text"
                placeholder="Search by title or ID..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 shadow-sm hover:shadow-md pr-10 text-sm"
                aria-label="Search problems"
              />
              {search && (
                <button
                  onClick={() => clearFilter("search")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  aria-label="Clear search"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="relative w-full sm:w-36 mb-3 sm:mb-0" ref={difficultyRef}>
              <button
                onClick={() => setIsDifficultyOpen(!isDifficultyOpen)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-left flex justify-between items-center transition-all duration-300 shadow-sm hover:shadow-md text-sm truncate"
                aria-label="Select difficulty"
              >
                <span className="truncate">{truncateText(difficulty || "Difficulty")}</span>
                <span className="flex-shrink-0 w-4 h-4">
                  {difficulty ? (
                    <XMarkIcon
                      className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearFilter("difficulty");
                      }}
                      aria-label="Clear difficulty filter"
                    />
                  ) : (
                    <svg
                      className={`w-4 h-4 text-gray-500 dark:text-gray-400 transform transition-transform ${isDifficultyOpen ? "rotate-180" : ""
                        }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  )}
                </span>
              </button>
              <AnimatePresence>
                {isDifficultyOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute z-10 mt-2 w-full rounded-lg bg-white dark:bg-gray-800 shadow-xl border border-gray-300 dark:border-gray-600 overflow-hidden"
                  >
                    {["All", "Easy", "Medium", "Hard"].map((option) => (
                      <button
                        key={option}
                        onClick={() => {
                          setDifficulty(option === "All" ? "" : option);
                          setPage(1);
                          setIsDifficultyOpen(false);
                          if (option !== "All") {
                            updateQuery({ ...router.query, difficulty: option });
                          } else {
                            const newQuery = { ...router.query };
                            delete newQuery.difficulty;
                            updateQuery(newQuery);
                          }
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
                      >
                        {option}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="relative w-full sm:w-36 mb-3 sm:mb-0" ref={tagRef}>
              <button
                onClick={() => setIsTagOpen(!isTagOpen)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-left flex justify-between items-center transition-all duration-300 shadow-sm hover:shadow-md text-sm truncate"
                aria-label="Select topic"
              >
                <span className="truncate">{truncateText(tag || "Topics")}</span>
                <span className="flex-shrink-0 w-4 h-4">
                  {tag ? (
                    <XMarkIcon
                      className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearFilter("tag");
                      }}
                      aria-label="Clear topic filter"
                    />
                  ) : (
                    <svg
                      className={`w-4 h-4 text-gray-500 dark:text-gray-400 transform transition-transform ${isTagOpen ? "rotate-180" : ""
                        }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  )}
                </span>
              </button>
              <AnimatePresence>
                {isTagOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute z-10 mt-2 w-full rounded-lg bg-white dark:bg-gray-800 shadow-xl border border-gray-300 dark:border-gray-600 overflow-y-auto max-h-60"
                  >
                    {allTags.map((t) => (
                      <button
                        key={t}
                        onClick={() => {
                          setTag(t === "All" ? "" : t);
                          setPage(1);
                          setIsTagOpen(false);
                          if (t !== "All") {
                            updateQuery({ ...router.query, tag: t });
                          } else {
                            const newQuery = { ...router.query };
                            delete newQuery.tag;
                            updateQuery(newQuery);
                          }
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
                      >
                        {t}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="flex flex-row items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-grow sm:w-36" ref={perPageRef}>
                <button
                  onClick={() => setIsPerPageOpen(!isPerPageOpen)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-left flex justify-between items-center transition-all duration-300 shadow-sm hover:shadow-md text-sm truncate"
                  aria-label="Select problems per page"
                >
                  <span className="truncate">{truncateText(`${perPage} Per Page`)}</span>
                  <span className="flex-shrink-0 w-4 h-4">
                    {perPage !== 10 ? (
                      <XMarkIcon
                        className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                        onClick={(e) => {
                          e.stopPropagation();
                          clearFilter("perPage");
                        }}
                        aria-label="Reset problems per page"
                      />
                    ) : (
                      <svg
                        className={`w-4 h-4 text-gray-500 dark:text-gray-400 transform transition-transform ${isPerPageOpen ? "rotate-180" : ""
                          }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    )}
                  </span>
                </button>
                <AnimatePresence>
                  {isPerPageOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute z-10 mt-2 w-full rounded-lg bg-white dark:bg-gray-800 shadow-xl border border-gray-300 dark:border-gray-600 overflow-hidden"
                    >
                      {[10, 25, 50, 100, 500].map((value) => (
                        <button
                          key={value}
                          onClick={() => {
                            setPerPage(value);
                            setPage(1);
                            setIsPerPageOpen(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
                        >
                          {value} per page
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              {/* <button
                onClick={toggleViewMode}
                className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 shadow-sm hover:shadow-md w-10 h-10 flex items-center justify-center flex-shrink-0"
                aria-label={`Switch to ${viewMode === "list" ? "table" : "list"} view`}
              >
                {viewMode === "list" ? (
                  <TableCellsIcon className="w-5 h-5" />
                ) : (
                  <ListBulletIcon className="w-5 h-5" />
                )}
              </button> */}
            </div>
          </div>
        </motion.div>

        {/* Table Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-100 dark:bg-gray-800">
                <tr>
                  {["title", "difficulty", "topics", "article"].map((column) => (
                    <th
                      key={column}
                      scope="col"
                      className={`px-2 sm:px-4 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider ${
                        column === "title" || column === "difficulty"
                          ? "cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
                          : ""
                      }`}
                      onClick={() => (column === "title" || column === "difficulty") && handleSort(column)}
                    >
                      <div className="flex items-center gap-2">
                        {column.charAt(0).toUpperCase() + column.slice(1)}
                        {sortColumn === column && sortDirection && (
                          sortDirection === "asc" ? (
                            <ChevronUpIcon className="w-4 h-4 text-gray-500 dark:text-gray-300" />
                          ) : (
                            <ChevronDownIcon className="w-4 h-4 text-gray-500 dark:text-gray-300" />
                          )
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedProblems.length === 0 ? (
                  <tr>
                    <td
                      colSpan="4"
                      className="px-2 sm:px-4 py-6 sm:py-8 text-center text-gray-500 dark:text-gray-400 text-sm"
                    >
                      No problems found. Try adjusting your filters.
                    </td>
                  </tr>
                ) : (
                  paginatedProblems.map((problem) => (
                    <motion.tr
                      key={problem.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200"
                    >
                      <td className="px-2 sm:px-4 py-3 sm:py-4 text-sm">
                        <Link
                          href={`/leetcode/${problem.id}`}
                          className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                        >
                          {problem.id}. {problem.title}
                        </Link>
                      </td>
                      <td className="px-2 sm:px-4 py-3 sm:py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-medium border ${getDifficultyColor(
                            problem.difficulty
                          )}`}
                        >
                          {problem.difficulty}
                        </span>
                      </td>
                      <td className="px-2 sm:px-4 py-3 sm:py-4">
                        <div className="flex flex-wrap gap-1 sm:gap-2">
                          {problem.tags?.map((tag) => (
                            <Link
                              key={tag}
                              href={`/leetcode?tag=${encodeURIComponent(tag)}`}
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 transition-all duration-200"
                              onClick={() => setPage(1)}
                            >
                              {tag}
                            </Link>
                          ))}
                        </div>
                      </td>
                      <td className="px-2 sm:px-4 py-3 sm:py-4 text-sm">
                        <Link
                          href={`/leetcode/${problem.id}`}
                          className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium flex items-center gap-1"
                        >
                          <DocumentTextIcon className="w-4 items-center h-4" />
                        </Link>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Pagination Section */}
        {totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-between gap-4"
          >
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <span>
                Showing {(page - 1) * perPage + 1} to{" "}
                {Math.min(page * perPage, sortedProblems.length)} of{" "}
                {sortedProblems.length} problems
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
                aria-label="Previous page"
              >
                <ChevronLeftIcon className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .slice(
                    Math.max(0, page - 3),
                    Math.min(totalPages, page + 2)
                  )
                  .map((p) => (
                    <button
                      key={p}
                      onClick={() => handlePageChange(p)}
                      className={`px-3 py-1 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium transition-all duration-200 ${
                        p === page
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
              </div>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
                className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
                aria-label="Next page"
              >
                <ChevronRightIcon className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </main>
    </Layout>
  );
}