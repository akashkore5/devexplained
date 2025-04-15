import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import problems from "../../data/problems.json";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Layout from "../../components/Layout";
import Head from "next/head";
import DOMPurify from "isomorphic-dompurify";
import {
  ChevronUpIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  DocumentTextIcon,
  TableCellsIcon,
  ListBulletIcon,
} from "@heroicons/react/24/solid";

export default function Leetcode() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [tag, setTag] = useState("");
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState(null);
  const [isDifficultyOpen, setIsDifficultyOpen] = useState(false);
  const [isTagOpen, setIsTagOpen] = useState(false);
  const [isPerPageOpen, setIsPerPageOpen] = useState(false);
  const [viewMode, setViewMode] = useState("list"); // Default to list for SSR
  const [userToggledView, setUserToggledView] = useState(false); // Track user toggle

  const difficultyRef = useRef(null);
  const tagRef = useRef(null);
  const perPageRef = useRef(null);

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

  // Set view mode based on screen size with debouncing
  useEffect(() => {
    let timeout;
    const handleResize = () => {
      // Skip if user has manually toggled the view
      if (userToggledView) return;

      clearTimeout(timeout);
      timeout = setTimeout(() => {
        setViewMode(window.innerWidth >= 768 ? "table" : "list");
      }, 200); // 200ms debounce
    };

    handleResize(); // Set initial view
    window.addEventListener("resize", handleResize);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener("resize", handleResize);
    };
  }, [userToggledView]);

  const updateQuery = (newQuery) => {
    router.push(
      {
        pathname: router.pathname,
        query: newQuery,
      },
      undefined,
      { shallow: true }
    );
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
          p.title.toLowerCase().includes(search.toLowerCase()) ||
          p.id.toString() === search
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

  const sortedProblems = useMemo(() => {
    if (!sortColumn || !sortDirection) {
      return [...filtered]; // Original order (no sort)
    }
    return [...filtered].sort((a, b) => {
      if (sortColumn === "title") {
        return sortDirection === "asc"
          ? Number(a.id) - Number(b.id)
          : Number(b.id) - Number(a.id);
      }
      return sortDirection === "asc"
        ? String(a.difficulty).localeCompare(String(b.difficulty))
        : String(b.difficulty).localeCompare(String(a.difficulty));
    });
  }, [filtered, sortColumn, sortDirection]);

  const totalPages = Math.ceil(sortedProblems.length / perPage);
  const paginated = sortedProblems.slice((page - 1) * perPage, page * perPage);

  const handleSort = (column) => {
    if (sortColumn === column) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortColumn(null);
        setSortDirection(null);
      } else {
        setSortDirection("asc");
      }
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const clearFilter = (filterType) => {
    if (filterType === "search") {
      setSearch("");
      setPage(1);
    } else if (filterType === "difficulty") {
      setDifficulty("");
      setPage(1);
      const newQuery = { ...router.query };
      delete newQuery.difficulty;
      updateQuery(newQuery);
    } else if (filterType === "tag") {
      setTag("");
      setPage(1);
      const newQuery = { ...router.query };
      delete newQuery.tag;
      updateQuery(newQuery);
    } else if (filterType === "perPage") {
      setPerPage(10);
      setPage(1);
    }
  };

  const truncateText = (text, maxLength = 16) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + "...";
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "Easy":
        return "bg-green-100 dark:bg-green-100 text-green-800 border-green-200 hover:bg-green-400 dark:hover:bg-green-400";
      case "Medium":
        return "bg-yellow-100 dark:bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-400 dark:hover:bg-yellow-400";
      case "Hard":
        return "bg-red-100 dark:bg-red-100 text-red-800 border-red-200 hover:bg-red-400 dark:hover:bg-red-400";
      default:
        return "bg-gray-100 dark:bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const handlePageChange = (newPage) => {
    setPage(Math.max(1, Math.min(newPage, totalPages)));
  };

  const toggleViewMode = () => {
    setViewMode((prev) => (prev === "list" ? "table" : "list"));
    setUserToggledView(true); // Mark that user has toggled
  };

  // Animation variants for list view
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
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
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
          content={`https://devexplained.vercel.app/leetcode${tag ? `?tag=${encodeURIComponent(tag)}` : ""}`}
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
          href={`https://devexplained.vercel.app/leetcode${tag ? `?tag=${encodeURIComponent(tag)}` : ""}`}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(
              JSON.stringify({
                "@context": "https://schema.org",
                "@type": "ItemList",
                "url": `https://devexplained.vercel.app/leetcode${tag ? `?tag=${encodeURIComponent(tag)}` : ""}`,
                "name": `Leetcode ${search || "all"} problems`,
                "description": `Find solutions to ${search || "all"} Leetcode problems with expert tutorials.`,
                "itemListElement": filtered.map((p, index) => ({
                  "@type": "ListItem",
                  "position": index + 1,
                  "url": `https://devexplained.vercel.app/leetcode/${p.id}`,
                  "name": `${p.id}. ${p.title}`,
                  "description": `Difficulty: ${p.difficulty}, Tags: ${p.tags?.join(", ") || ""}`,
                })),
              })
            ),
          }}
        />
      </Head>

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Filters Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8"
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
                      className={`w-4 h-4 text-gray-500 dark:text-gray-400 transform transition-transform ${isDifficultyOpen ? "rotate-180" : ""}`}
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
                      className={`w-4 h-4 text-gray-500 dark:text-gray-400 transform transition-transform ${isTagOpen ? "rotate-180" : ""}`}
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
                  <span className="truncate">{truncateText(`${perPage} / Page`)}</span>
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
                        className={`w-4 h-4 text-gray-500 dark:text-gray-400 transform transition-transform ${isPerPageOpen ? "rotate-180" : ""}`}
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
                      {[10, 25, 50, 100].map((value) => (
                        <button
                          key={value}
                          onClick={() => {
                            setPerPage(value);
                            setPage(1);
                            setIsPerPageOpen(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
                        >
                          {value} / page
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <button
                onClick={toggleViewMode}
                className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 shadow-sm hover:shadow-md w-10 h-10 flex items-center justify-center flex-shrink-0"
                aria-label={`Switch to ${viewMode === "list" ? "table" : "list"} view`}
              >
                {viewMode === "list" ? (
                  <TableCellsIcon className="w-5 h-5" />
                ) : (
                  <ListBulletIcon className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Main Content and Sidebar */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Problem List/Table */}
          <div className="w-full lg:w-3/4">
            {viewMode === "list" ? (
              <ul className="space-y-6">
                {paginated.length === 0 ? (
                  <li className="text-center text-gray-500 dark:text-gray-400 py-10 text-lg">
                    No problems found. Try adjusting your filters.
                  </li>
                ) : (
                  paginated.map(({ id, title, difficulty: diff, tags }) => (
                    <motion.li
                      key={id}
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      className="border rounded-xl p-6 bg-white dark:bg-slate-900 shadow-lg hover:shadow-xl transition transform hover:-translate-y-2 cursor-pointer"
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
                              href={`/leetcode?tag=${encodeURIComponent(t)}`}
                              className="text-sm bg-gray-100 dark:bg-slate-700 px-3 py-1 rounded-full hover:bg-gray-200 dark:hover:bg-slate-600 transition"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPage(1);
                              }}
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
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden"
              >
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-100 dark:bg-gray-700">
                      <tr>
                        {["title", "difficulty", "topics", "article"].map((column) => (
                          <th
                            key={column}
                            scope="col"
                            className={`px-4 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider ${
                              column === "title" || column === "difficulty"
                                ? "cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
                                : ""
                            }`}
                            onClick={() =>
                              (column === "title" || column === "difficulty") && handleSort(column)
                            }
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
                      {paginated.length === 0 ? (
                        <tr>
                          <td
                            colSpan="4"
                            className="px-4 py-8 text-center text-gray-500 dark:text-gray-400 text-lg"
                          >
                            No problems found. Try adjusting your filters.
                          </td>
                        </tr>
                      ) : (
                        paginated.map((problem) => (
                          <motion.tr
                            key={problem.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200"
                          >
                            <td className="px-4 py-4 text-sm">
                              <Link
                                href={`/leetcode/${problem.id}`}
                                className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                              >
                                {problem.id}. {problem.title}
                              </Link>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex flex-wrap gap-2 sm:gap-1">
                                <Link
                                  href={`/leetcode?difficulty=${encodeURIComponent(
                                    problem.difficulty
                                  )}`}
                                  className={`inline-block text-center px-1.5 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 border transition-all duration-200 truncate max-w-[80px] sm:max-w-[60px] overflow-hidden text-overflow-ellipsis whitespace-nowrap ${getDifficultyColor(
                                    problem.difficulty
                                  )}`}
                                  title={problem.difficulty}
                                  aria-label={`Filter by ${problem.difficulty} difficulty`}
                                >
                                  {problem.difficulty}
                                </Link>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex flex-wrap gap-2 sm:gap-1">
                                {problem.tags?.map((t) => (
                                  <Link
                                    key={t}
                                    href={`/leetcode?tag=${encodeURIComponent(t)}`}
                                    className={`inline-block text-center px-1 py-0.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 transition-all duration-200 truncate max-w-[100px] sm:max-w-[60px] overflow-hidden text-overflow-ellipsis whitespace-nowrap ${
                                      t.length > 15 ? "text-[10px]" : ""
                                    }`}
                                    onClick={() => setPage(1)}
                                    title={t}
                                    aria-label={`Filter by ${t} tag`}
                                  >
                                    {t}
                                  </Link>
                                ))}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <Link
                                href={`/leetcode/${problem.id}`}
                                className="inline-flex justify-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-all duration-200 w-full"
                                aria-label={`View article for ${problem.title}`}
                              >
                                <DocumentTextIcon className="w-5 h-5" />
                              </Link>
                            </td>
                          </motion.tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </div>

          {/* Tag Sidebar (Desktop) */}
          <aside className="w-full lg:w-1/4 hidden lg:block">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden sticky top-6 max-h-[calc(100vh-3rem)]"
            >
              <div className="sticky top-0 bg-white dark:bg-slate-800 z-10 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                  Popular Topics
                </h3>
              </div>
              <div className="px-6 py-4 overflow-y-auto max-h-[calc(100vh-8rem)]">
                <ul className="space-y-3">
                  {allTags.map(
                    (t) =>
                      t !== "All" && (
                        <li key={t}>
                          <Link
                            href={`/leetcode?tag=${encodeURIComponent(t)}`}
                            className="text-indigo-600 dark:text-indigo-400 hover:underline flex justify-between items-center text-base"
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
                  )}
                </ul>
              </div>
            </motion.div>
          </aside>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4"
          >
            <div className="text-sm text-gray-600 dark:text-gray-300">
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
                className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 shadow-sm"
                aria-label="Previous page"
              >
                <ChevronLeftIcon className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .slice(Math.max(0, page - 3), Math.min(totalPages, page + 2))
                  .map((p) => (
                    <button
                      key={p}
                      onClick={() => handlePageChange(p)}
                      className={`px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium transition-all duration-200 shadow-sm ${
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
                className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 shadow-sm"
                aria-label="Next page"
              >
                <ChevronRightIcon className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Tag Section (Mobile) */}
        <div className="mt-8 lg:hidden">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden"
          >
            <div className="sticky top-0 bg-white dark:bg-slate-800 z-10 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                Popular Topics
              </h3>
            </div>
            <div className="px-6 py-4 overflow-y-auto max-h-96">
              <ul className="space-y-3">
                {allTags.map(
                  (t) =>
                    t !== "All" && (
                      <li key={t}>
                        <Link
                          href={`/leetcode?tag=${encodeURIComponent(t)}`}
                          className="text-indigo-600 dark:text-indigo-400 hover:underline flex justify-between items-center text-base"
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
                )}
              </ul>
            </div>
          </motion.div>
        </div>
      </main>
    </Layout>
  );
}