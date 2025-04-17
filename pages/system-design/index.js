import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/router";
import questions from "../../data/system_design_questions.json";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Layout from "../../components/Layout";
import Head from "next/head";
import DOMPurify from "isomorphic-dompurify";
import { useSession } from "next-auth/react";
import { toast, Toaster } from "react-hot-toast";
import {
  ChevronUpIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  DocumentTextIcon,
  TableCellsIcon,
  ListBulletIcon,
  CheckCircleIcon,
  HeartIcon,
} from "@heroicons/react/24/solid";

export default function SystemDesign({ initialViewMode = "table" }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [tag, setTag] = useState("");
  const [perPage, setPerPage] = useState(15);
  const [page, setPage] = useState(1);
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState(null);
  const [isDifficultyOpen, setIsDifficultyOpen] = useState(false);
  const [isTagOpen, setIsTagOpen] = useState(false);
  const [isPerPageOpen, setIsPerPageOpen] = useState(false);
  const [viewMode, setViewMode] = useState(initialViewMode);
  const [userToggledView, setUserToggledView] = useState(false);
  const [solvedQuestions, setSolvedQuestions] = useState([]);
  const [taggedQuestions, setTaggedQuestions] = useState([]);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const difficultyRef = useRef(null);
  const tagRef = useRef(null);
  const perPageRef = useRef(null);

  // Fetch user's progress
  useEffect(() => {
    if (status !== "authenticated") return;

    const fetchProgress = async () => {
      try {
        const response = await fetch("/api/user/progress/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "systemdesign", action: "all" }),
        });
        if (!response.ok) throw new Error(`API error: ${response.status}`);
        const data = await response.json();
        if (!data || typeof data !== "object") throw new Error("Invalid API response");
        const solved = (data.solved || []).map(Number);
        const tagged = (data.tagged || []).map(Number);
        setSolvedQuestions(solved);
        setTaggedQuestions(tagged);
      } catch (error) {
        console.error("Error fetching progress:", error);
        toast.error("Failed to load progress");
      }
    };

    fetchProgress();
  }, [status]);

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

  // Handle resize for view mode
  useEffect(() => {
    let timeout;
    const handleResize = () => {
      if (userToggledView) return;
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        setViewMode(window.innerWidth >= 768 ? "table" : "list");
      }, 200);
    };

    handleResize();
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
    questions.forEach((q) => q.tags?.forEach((t) => tags.add(t)));
    return ["All", ...Array.from(tags).sort()];
  }, []);

  const tagCounts = useMemo(() => {
    const counts = {};
    questions.forEach((q) =>
      q.tags?.forEach((t) => (counts[t] = (counts[t] || 0) + 1))
    );
    return counts;
  }, []);

  const filtered = useMemo(() => {
    let result = questions;
    if (search) {
      result = result.filter(
        (q) =>
          q.title.toLowerCase().includes(search.toLowerCase()) ||
          q.id.toString() === search
      );
    }
    if (difficulty && difficulty !== "All") {
      result = result.filter((q) => q.difficulty === difficulty);
    }
    if (tag && tag !== "All") {
      result = result.filter((q) =>
        q.tags?.some((t) => t.toLowerCase() === tag.toLowerCase())
      );
    }
    return result;
  }, [search, difficulty, tag]);

  const sortedQuestions = useMemo(() => {
    if (!sortColumn || !sortDirection) {
      return [...filtered];
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

  const totalPages = Math.ceil(sortedQuestions.length / perPage);
  const paginated = sortedQuestions.slice((page - 1) * perPage, page * perPage);

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
      setPerPage(15);
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
      case "Beginner":
        return "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border-green-200 hover:bg-green-200 dark:hover:bg-green-800";
      case "Intermediate":
        return "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 border-yellow-200 hover:bg-yellow-200 dark:hover:bg-yellow-800";
      case "Advanced":
        return "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border-red-200 hover:bg-red-200 dark:hover:bg-red-800";
      default:
        return "bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-gray-200 border-gray-200";
    }
  };

  const handlePageChange = (newPage) => {
    setPage(Math.max(1, Math.min(newPage, totalPages)));
  };

  const toggleViewMode = () => {
    setViewMode((prev) => (prev === "list" ? "table" : "list"));
    setUserToggledView(true);
  };

  const handleMarkSolved = useCallback(
    async (id, isSolved) => {
      if (status !== "authenticated") {
        setIsLoginModalOpen(true);
        return;
      }

      const numericId = Number(id);
      try {
        const response = await fetch("/api/user/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "systemdesign",
            action: "solved",
            id: numericId,
            remove: isSolved,
          }),
        });
        if (response.ok) {
          setSolvedQuestions((prev) =>
            isSolved
              ? prev.filter((qid) => qid !== numericId)
              : [...prev, numericId]
          );
          toast.success(isSolved ? "Question unmarked as solved" : "Question marked as solved");
        } else {
          toast.error("Failed to update solved status");
        }
      } catch (error) {
        console.error("Error updating solved status:", error);
        toast.error("An error occurred");
      }
    },
    [status]
  );

  const handleTagQuestion = useCallback(
    async (id, isTagged) => {
      if (status !== "authenticated") {
        setIsLoginModalOpen(true);
        return;
      }

      const numericId = Number(id);
      try {
        const response = await fetch("/api/user/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "systemdesign",
            action: "tagged",
            id: numericId,
            remove: isTagged,
          }),
        });
        if (response.ok) {
          setTaggedQuestions((prev) =>
            isTagged
              ? prev.filter((qid) => qid !== numericId)
              : [...prev, numericId]
          );
          toast.success(isTagged ? "Question untagged" : "Question tagged");
        } else {
          toast.error("Failed to update tag status");
        }
      } catch (error) {
        console.error("Error updating tag status:", error);
        toast.error("An error occurred");
      }
    },
    [status]
  );

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  const difficultyVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: { duration: 0.5, type: "spring", stiffness: 100 },
    },
  };

  const iconVariants = {
    initial: { scale: 1 },
    hover: { scale: 1.2 },
    tap: { scale: 0.9 },
  };

  return (
    <Layout
      isLoginModalOpen={isLoginModalOpen}
      setIsLoginModalOpen={setIsLoginModalOpen}
    >
      <Head>
        <title>
          {`System Design Questions - ${search || "All"} Topics | SystemDesignGuide`}
        </title>
        <meta
          name="description"
          content={`Explore ${search || "all"} system design questions with detailed architectures, microservices, and tutorials. Filter by ${difficulty || "all difficulties"} and ${tag || "all topics"}.`}
        />
        <meta
          name="keywords"
          content={`system design, microservices, ${difficulty || "beginner intermediate advanced"}, ${tag || "all topics"}, scalability, caching, load balancing, API gateway, tutorials`}
        />
        <meta name="author" content="SystemDesignGuide Team" />
        <meta name="robots" content="index, follow" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta
          property="og:title"
          content={`System Design Questions - ${search || "All"} Topics | SystemDesignGuide`}
        />
        <meta
          property="og:description"
          content={`Master ${search || "all"} system design topics with in-depth guides on microservices, caching, and more.`}
        />
        <meta property="og:type" content="website" />
        <meta
          property="og:url"
          content={`https://devexplained.vercel.app/system-design${tag ? `?tag=${encodeURIComponent(tag)}` : ""}`}
        />
        <meta
          property="og:image"
          content="https://devexplained.vercel.app/og-image.jpg"
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content={`System Design Questions - ${search || "All"} Topics | SystemDesignGuide`}
        />
        <meta
          name="twitter:description"
          content={`Learn ${search || "all"} system design concepts with filters for ${difficulty || "all difficulties"} and ${tag || "all topics"}.`}
        />
        <meta
          name="twitter:image"
          content="https://devexplained.vercel.app/twitter-image.jpg"
        />
        <link
          rel="canonical"
          href={`https://devexplained.vercel.app/system-design${tag ? `?tag=${encodeURIComponent(tag)}` : ""}`}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(
              JSON.stringify({
                "@context": "https://schema.org",
                "@type": "ItemList",
                "url": `https://devexplained.vercel.app/system-design${tag ? `?tag=${encodeURIComponent(tag)}` : ""}`,
                "name": `System Design ${search || "all"} topics`,
                "description": `Explore ${search || "all"} system design questions with detailed guides.`,
                "itemListElement": filtered.map((q, index) => ({
                  "@type": "ListItem",
                  "position": index + 1,
                  "url": `https://devexplained.vercel.app/system-design/${q.id}`,
                  "name": `${q.id}. ${q.title}`,
                  "description": `Difficulty: ${q.difficulty}, Tags: ${q.tags?.join(", ") || ""}`,
                })),
              })
            ),
          }}
        />
      </Head>
      <Toaster />
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Filters Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 mb-8"
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
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 shadow-sm hover:shadow-md pr-10 text-sm"
                aria-label="Search system design questions"
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
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-gray-100 text-left flex justify-between items-center transition-all duration-300 shadow-sm hover:shadow-md text-sm truncate"
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
                      viewBox="0 24"
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
                    className="absolute z-10 mt-2 w-full rounded-lg bg-white dark:bg-slate-800 shadow-xl border border-gray-300 dark:border-gray-600 overflow-hidden"
                  >
                    {["All", "Beginner", "Intermediate", "Advanced"].map((option) => (
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
                        className="w-full px-4 py-2 text-left text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-slate-700 transition-all duration-200"
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
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-gray-100 text-left flex justify-between items-center transition-all duration-300 shadow-sm hover:shadow-md text-sm truncate"
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
                    className="absolute z-10 mt-2 w-full rounded-lg bg-white dark:bg-slate-800 shadow-xl border border-gray-300 dark:border-gray-600 overflow-y-auto max-h-60"
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
                        className="w-full px-4 py-2 text-left text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-slate-700 transition-all duration-200"
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
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-gray-100 text-left flex justify-between items-center transition-all duration-300 shadow-sm hover:shadow-md text-sm truncate"
                  aria-label="Select questions per page"
                >
                  <span className="truncate">{truncateText(`${perPage} / Page`)}</span>
                  <span className="flex-shrink-0 w-4 h-4">
                    {perPage !== 15 ? (
                      <XMarkIcon
                        className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                        onClick={(e) => {
                          e.stopPropagation();
                          clearFilter("perPage");
                        }}
                        aria-label="Reset questions per page"
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
                      className="absolute z-10 mt-2 w-full rounded-lg bg-white dark:bg-slate-800 shadow-xl border border-gray-300 dark:border-gray-600 overflow-hidden"
                    >
                      {[15, 25, 50, 100].map((value) => (
                        <button
                          key={value}
                          onClick={() => {
                            setPerPage(value);
                            setPage(1);
                            setIsPerPageOpen(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-slate-700 transition-all duration-200"
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
                className="p-2 rounded-lg bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-all duration-200 shadow-sm hover:shadow-md w-10 h-10 flex items-center justify-center flex-shrink-0"
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
          {/* Question List/Table */}
          <div className="w-full lg:w-3/4">
            {viewMode === "list" ? (
              <ul className="space-y-6">
                {paginated.length === 0 ? (
                  <li className="text-center text-gray-500 dark:text-gray-400 py-10 text-lg">
                    No questions found. Try adjusting your filters.
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
                      onClick={() => router.push(`/system-design/${id}`)}
                    >
                      <div className="flex flex-col">
                        <div className="flex items-center justify-between">
                          <Link
                            href={`/system-design/${id}`}
                            className="text-xl font-semibold text-indigo-600 dark:text-indigo-400 hover:underline mb-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {id}. {title}
                          </Link>
                          <motion.button
                            variants={iconVariants}
                            initial="initial"
                            whileHover="hover"
                            whileTap="tap"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkSolved(id, solvedQuestions.includes(Number(id)));
                            }}
                            className={`rounded-full p-1 ${
                              solvedQuestions.includes(Number(id))
                                ? "bg-green-500 text-white"
                                : "bg-gray-200 text-gray-500"
                            }`}
                            aria-label={
                              solvedQuestions.includes(Number(id))
                                ? "Unmark as solved"
                                : "Mark as solved"
                            }
                          >
                            <CheckCircleIcon className="w-6 h-6" />
                          </motion.button>
                        </div>
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
                                  diff === "Beginner"
                                    ? "#34D399"
                                    : diff === "Intermediate"
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
                              href={`/system-design?tag=${encodeURIComponent(t)}`}
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
                        <div className="flex gap-3 mt-4">
                          <motion.button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkSolved(id, solvedQuestions.includes(Number(id)));
                            }}
                            className="flex items-center px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 dark:from-indigo-800 dark:to-indigo-900 text-white rounded-lg shadow-md hover:scale-105 transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            aria-label={
                              solvedQuestions.includes(Number(id))
                                ? "Unmark as solved"
                                : "Mark as solved"
                            }
                          >
                            <CheckCircleIcon className="w-5 h-5 mr-2" />
                            {solvedQuestions.includes(Number(id)) ? "Unmark Solved" : "Mark as Solved"}
                          </motion.button>
                          <motion.button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTagQuestion(id, taggedQuestions.includes(Number(id)));
                            }}
                            className="flex items-center px-4 py-2 bg-gradient-to-r from-pink-600 to-pink-700 dark:from-pink-800 dark:to-pink-900 text-white rounded-lg shadow-md hover:scale-105 transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-pink-500"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            aria-label={
                              taggedQuestions.includes(Number(id)) ? "Untag question" : "Tag question"
                            }
                          >
                            <HeartIcon className="w-5 h-5 mr-2" />
                            {taggedQuestions.includes(Number(id)) ? "Untag" : "Tag"}
                          </motion.button>
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
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden"
              >
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-100 dark:bg-slate-700">
                      <tr>
                        <th
                          scope="col"
                          className="px-4 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider w-12"
                        >
                          Status
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-600 transition-all duration-200"
                          onClick={() => handleSort("title")}
                        >
                          <div className="flex items-center gap-2">
                            Title
                            {sortColumn === "title" && sortDirection && (
                              sortDirection === "asc" ? (
                                <ChevronUpIcon className="w-4 h-4 text-gray-500 dark:text-gray-300" />
                              ) : (
                                <ChevronDownIcon className="w-4 h-4 text-gray-500 dark:text-gray-300" />
                              )
                            )}
                          </div>
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-600 transition-all duration-200"
                          onClick={() => handleSort("difficulty")}
                        >
                          <div className="flex items-center gap-2">
                            Difficulty
                            {sortColumn === "difficulty" && sortDirection && (
                              sortDirection === "asc" ? (
                                <ChevronUpIcon className="w-4 h-4 text-gray-500 dark:text-gray-300" />
                              ) : (
                                <ChevronDownIcon className="w-4 h-4 text-gray-500 dark:text-gray-300" />
                              )
                            )}
                          </div>
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider"
                        >
                          Topics
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider w-12"
                        >
                          Tag/Like
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider w-12"
                        >
                          Article
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {paginated.length === 0 ? (
                        <tr>
                          <td
                            colSpan="6"
                            className="px-4 py-8 text-center text-gray-500 dark:text-gray-400 text-lg"
                          >
                            No questions found. Try adjusting your filters.
                          </td>
                        </tr>
                      ) : (
                        paginated.map((question) => (
                          <motion.tr
                            key={question.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className="hover:bg-gray-50 dark:hover:bg-slate-900 transition-all duration-200"
                          >
                            <td className="px-4 py-4 w-12">
                              <motion.button
                                variants={iconVariants}
                                initial="initial"
                                whileHover="hover"
                                whileTap="tap"
                                onClick={() =>
                                  handleMarkSolved(
                                    question.id,
                                    solvedQuestions.includes(Number(question.id))
                                  )
                                }
                                className={`rounded-full p-1 ${
                                  solvedQuestions.includes(Number(question.id))
                                    ? "bg-green-500 text-white"
                                    : "bg-gray-200 text-gray-500"
                                }`}
                                aria-label={
                                  solvedQuestions.includes(Number(question.id))
                                    ? "Unmark as solved"
                                    : "Mark as solved"
                                }
                              >
                                <CheckCircleIcon className="w-6 h-6" />
                              </motion.button>
                            </td>
                            <td className="px-4 py-4 text-sm">
                              <Link
                                href={`/system-design/${question.id}`}
                                className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                              >
                                {question.id}. {question.title}
                              </Link>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex flex-wrap gap-2 sm:gap-1">
                                <Link
                                  href={`/system-design?difficulty=${encodeURIComponent(
                                    question.difficulty
                                  )}`}
                                  className={`inline-block text-center px-1.5 py-1 rounded-lg text-xs font-medium border transition-all duration-200 truncate max-w-[80px] sm:max-w-[60px] overflow-hidden text-overflow-ellipsis whitespace-nowrap ${getDifficultyColor(
                                    question.difficulty
                                  )}`}
                                  title={question.difficulty}
                                  aria-label={`Filter by ${question.difficulty} difficulty`}
                                >
                                  {question.difficulty}
                                </Link>
                              </div>
                            </td>
                            <td className="px-4 py-4 min-w-[150px] max-w-[250px]">
                              <div
                                className="flex flex-wrap gap-2 sm:gap-1 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600"
                                aria-label="Question tags"
                              >
                                {question.tags?.map((t) => (
                                  <Link
                                    key={t}
                                    href={`/system-design?tag=${encodeURIComponent(t)}`}
                                    className={`inline-block text-center px-1 py-0.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-600 border border-gray-200 dark:border-gray-600 transition-all duration-200 truncate max-w-[100px] sm:max-w-[60px] overflow-hidden text-overflow-ellipsis whitespace-nowrap ${
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
                            <td className="px-4 py-4 w-12">
                              <motion.button
                                variants={iconVariants}
                                initial="initial"
                                whileHover="hover"
                                whileTap="tap"
                                onClick={() =>
                                  handleTagQuestion(
                                    question.id,
                                    taggedQuestions.includes(Number(question.id))
                                  )
                                }
                                className={`p-1 ${
                                  taggedQuestions.includes(Number(question.id))
                                    ? "text-green-500"
                                    : "text-gray-400"
                                }`}
                                aria-label={
                                  taggedQuestions.includes(Number(question.id))
                                    ? "Untag question"
                                    : "Tag question"
                                }
                              >
                                <HeartIcon className="w-6 h-6" />
                              </motion.button>
                            </td>
                            <td className="px-4 py-4 w-12">
                              <Link
                                href={`/system-design/${question.id}`}
                                className="inline-flex justify-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-all duration-200 w-full"
                                aria-label={`View article for ${question.title}`}
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
              <div className="sticky top-0 bg-white dark:bg-slate-800 z-10 px-6 py-4 border-b border-gray-200 dark:border-slate-700">
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
                            href={`/system-design?tag=${encodeURIComponent(t)}`}
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
                {Math.min(page * perPage, sortedQuestions.length)} of{" "}
                {sortedQuestions.length} questions
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className="p-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-slate-700 transition-all duration-200 shadow-sm"
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
                      className={`px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-700 text-sm font-medium transition-all duration-200 shadow-sm ${
                        p === page
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
              </div>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
                className="p-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-slate-700 transition-all duration-200 shadow-sm"
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
            <div className="sticky top-0 bg-white dark:bg-slate-800 z-10 px-6 py-4 border-b border-gray-200 dark:border-slate-700">
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
                          href={`/system-design?tag=${encodeURIComponent(t)}`}
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