import { useState, useEffect, useCallback } from "react";
import { useSession, getSession } from "next-auth/react";
import Head from "next/head";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { toast, Toaster } from "react-hot-toast";
import { UserIcon, CodeBracketIcon, RocketLaunchIcon } from "@heroicons/react/24/solid";
import DOMPurify from "isomorphic-dompurify";
import Layout from "../components/Layout";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import problems from "../data/problems.json";
import systemDesignQuestions from "../data/system_design_questions.json";

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

export default function Profile({ totalLeetcodeQuestions, totalSystemDesignQuestions }) {
  const { data: session, status } = useSession();
  const [userName, setUserName] = useState("");
  const [progress, setProgress] = useState({
    leetcode: { solved: [], tagged: [] },
    systemdesign: { viewed: [], solved: [], tagged: [] },
  });
  const [isLoadingProgress, setIsLoadingProgress] = useState(false);
  const [openAccordion, setOpenAccordion] = useState(null);

  // Fetch user progress
  const fetchProgress = useCallback(async () => {
    setIsLoadingProgress(true);
    try {
      const response = await fetch("/api/user/progress/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "all", action: "all" }),
      });
      const data = await response.json();
      if (response.ok) {
        setProgress({
          leetcode: {
            solved: (data.leetcode?.solved || []).map(Number),
            tagged: (data.leetcode?.tagged || []).map(Number),
          },
          systemdesign: {
            viewed: (data.systemdesign?.viewed || []).map(Number),
            solved: (data.systemdesign?.solved || []).map(Number),
            tagged: (data.systemdesign?.tagged || []).map(Number),
          },
        });
      } else {
        toast.error(data.message || "Failed to fetch progress");
      }
    } catch (error) {
      console.error("Fetch progress error:", error.message);
      toast.error("Error loading progress");
    } finally {
      setIsLoadingProgress(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      setUserName(session.user.name || "User");
      fetchProgress();
    } else {
      setUserName("");
    }
  }, [status, session, fetchProgress]);

  // Calculate progress stats
  const leetcodeStats = {
    solved: progress.leetcode.solved.length || 0,
    tagged: progress.leetcode.tagged.length || 0,
    remaining: totalLeetcodeQuestions - (progress.leetcode.solved.length || 0),
  };
  const systemDesignStats = {
    viewed: progress.systemdesign.viewed.length || 0,
    solved: progress.systemdesign.solved.length || 0,
    tagged: progress.systemdesign.tagged.length || 0,
    remaining: totalSystemDesignQuestions - (progress.systemdesign.solved.length || 0),
  };

  // Map IDs to titles
  const leetcodeSolved = progress.leetcode.solved.map((id) => ({
    id,
    title: problems.find((p) => p.id === id)?.title || `Problem ${id}`,
  }));
  const leetcodeTagged = progress.leetcode.tagged.map((id) => ({
    id,
    title: problems.find((p) => p.id === id)?.title || `Problem ${id}`,
  }));
  const systemDesignSolved = progress.systemdesign.solved.map((id) => ({
    id,
    title: systemDesignQuestions.find((q) => q.id === id)?.title || `Article ${id}`,
  }));
  const systemDesignViewed = progress.systemdesign.viewed.map((id) => ({
    id,
    title: systemDesignQuestions.find((q) => q.id === id)?.title || `Article ${id}`,
  }));
  const systemDesignTagged = progress.systemdesign.tagged.map((id) => ({
    id,
    title: systemDesignQuestions.find((q) => q.id === id)?.title || `Article ${id}`,
  }));

  // Pie chart data
  const leetcodePieData = {
    labels: ["Solved", "Tagged", "Remaining"],
    datasets: [
      {
        data: [leetcodeStats.solved, leetcodeStats.tagged, leetcodeStats.remaining],
        backgroundColor: ["#4f46e5", "#db2777", "#e5e7eb"],
        borderColor: ["#ffffff", "#ffffff", "#ffffff"],
        borderWidth: 1,
      },
    ],
  };
  const systemDesignPieData = {
    labels: ["Solved", "Viewed", "Tagged", "Remaining"],
    datasets: [
      {
        data: [
          systemDesignStats.solved,
          systemDesignStats.viewed,
          systemDesignStats.tagged,
          systemDesignStats.remaining,
        ],
        backgroundColor: ["#4f46e5", "#2563eb", "#db2777", "#e5e7eb"],
        borderColor: ["#ffffff", "#ffffff", "#ffffff", "#ffffff"],
        borderWidth: 1,
      },
    ],
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          color: typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches ? "#e5e7eb" : "#1f2937",
          font: { size: 12 },
          padding: 20,
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleFont: { size: 14 },
        bodyFont: { size: 12 },
        padding: 12,
        callbacks: {
          label: (context) => `${context.label}: ${context.raw}`,
        },
      },
    },
  };

  // Animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const accordionVariants = {
    hidden: { height: 0, opacity: 0 },
    visible: { height: "auto", opacity: 1, transition: { duration: 0.3 } },
  };

  // Handle accordion toggle
  const toggleAccordion = (section) => {
    setOpenAccordion(openAccordion === section ? null : section);
  };

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50 dark:bg-slate-900">
        <svg
          className="animate-spin h-8 w-8 text-indigo-600 dark:text-indigo-400"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      </div>
    );
  }

  return (
    <Layout isLoggedIn={status === "authenticated"} userName={userName}>
      <Head>
        <title>LeetcodeSolve - Your Profile</title>
        <meta
          name="description"
          content="Track your progress on Leetcode problems and system design articles, view solved, tagged, and viewed items, and visualize your achievements."
        />
        <meta
          name="keywords"
          content="Leetcode progress, system design progress, coding profile, interview prep, progress tracking"
        />
        <meta name="author" content="LeetcodeSolve Team" />
        <meta name="robots" content="index, follow" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta property="og:title" content="LeetcodeSolve - Your Profile" />
        <meta
          property="og:description"
          content="Track your coding and system design progress with LeetcodeSolve's personalized profile page."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://leetcodesolve.vercel.app/profile" />
        <meta
          property="og:image"
          content="https://leetcodesolve.vercel.app/og-image.jpg"
        />
        <meta
          property="og:image:alt"
          content="LeetcodeSolve user profile preview"
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="LeetcodeSolve - Your Profile"
        />
        <meta
          name="twitter:description"
          content="Visualize your Leetcode and system design progress with charts and detailed lists."
        />
        <meta
          name="twitter:image"
          content="https://leetcodesolve.vercel.app/twitter-image.jpg"
        />
        <meta
          name="twitter:image:alt"
          content="LeetcodeSolve user profile preview"
        />
        <link rel="canonical" href="https://leetcodesolve.vercel.app/profile" />
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
        <meta name="theme-color" content="#4f46e5" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(
              JSON.stringify({
                "@context": "https://schema.org",
                "@type": "ProfilePage",
                name: "LeetcodeSolve User Profile",
                url: "https://leetcodesolve.vercel.app/profile",
                description: "View your progress on Leetcode problems and system design articles, including solved, tagged, and viewed items.",
                publisher: {
                  "@type": "Organization",
                  name: "LeetcodeSolve Team",
                },
              })
            ),
          }}
        />
      </Head>

      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />

      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-b from-gray-50 to-white dark:from-slate-900 dark:to-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl sm:text-5xl font-extrabold text-gray-800 dark:text-gray-100 mb-6"
          >
            Your Profile, <span className="text-indigo-600 dark:text-indigo-400">{userName}</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto"
          >
            Track your progress, view your achievements, and plan your next steps in coding and system design.
          </motion.p>
        </div>
      </section>

      {/* User Details */}
      <section className="py-16 bg-gray-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6"
          >
            <div className="flex items-center space-x-4">
              <UserIcon className="w-12 h-12 text-indigo-600 dark:text-indigo-400" />
              <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                  {session?.user.name || "User"}
                </h2>
                <p className="text-gray-600 dark:text-gray-300">{session?.user.email}</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Progress Section */}
      <section className="py-16 bg-gray-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-bold text-center text-gray-800 dark:text-gray-100 mb-12"
          >
            Your Progress Overview
          </motion.h2>
          {isLoadingProgress ? (
            <div className="text-center">
              <svg
                className="animate-spin h-8 w-8 text-indigo-600 dark:text-indigo-400 mx-auto"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <p className="text-gray-600 dark:text-gray-300 mt-2">Loading progress...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Leetcode Progress */}
              <motion.div
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                className="p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-lg"
              >
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center">
                  <CodeBracketIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400 mr-2" />
                  Leetcode Progress
                </h3>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600 dark:text-gray-300">Solved</span>
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">{leetcodeStats.solved}/{totalLeetcodeQuestions}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2.5">
                      <motion.div
                        className="bg-indigo-600 h-2.5 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${(leetcodeStats.solved / totalLeetcodeQuestions) * 100}%` }}
                        transition={{ duration: 0.5 }}
                      ></motion.div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600 dark:text-gray-300">Tagged</span>
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">{leetcodeStats.tagged}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2.5">
                      <motion.div
                        className="bg-pink-600 h-2.5 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${(leetcodeStats.tagged / totalLeetcodeQuestions) * 100}%` }}
                        transition={{ duration: 0.5 }}
                      ></motion.div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600 dark:text-gray-300">Remaining</span>
                      <span className="font-semibold text-gray-600 dark:text-gray-400">{leetcodeStats.remaining}</span>
                    </div>
                  </div>
                  <div className="h-64">
                    <Pie data={leetcodePieData} options={pieOptions} />
                  </div>
                </div>
              </motion.div>
              {/* System Design Progress */}
              <motion.div
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                className="p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-lg"
              >
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center">
                  <RocketLaunchIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400 mr-2" />
                  System Design Progress
                </h3>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600 dark:text-gray-300">Solved</span>
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">{systemDesignStats.solved}/{totalSystemDesignQuestions}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2.5">
                      <motion.div
                        className="bg-indigo-600 h-2.5 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${(systemDesignStats.solved / totalSystemDesignQuestions) * 100}%` }}
                        transition={{ duration: 0.5 }}
                      ></motion.div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600 dark:text-gray-300">Viewed</span>
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">{systemDesignStats.viewed}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2.5">
                      <motion.div
                        className="bg-blue-600 h-2.5 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${(systemDesignStats.viewed / totalSystemDesignQuestions) * 100}%` }}
                        transition={{ duration: 0.5 }}
                      ></motion.div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600 dark:text-gray-300">Tagged</span>
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">{systemDesignStats.tagged}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2.5">
                      <motion.div
                        className="bg-pink-600 h-2.5 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${(systemDesignStats.tagged / totalSystemDesignQuestions) * 100}%` }}
                        transition={{ duration: 0.5 }}
                      ></motion.div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600 dark:text-gray-300">Remaining</span>
                      <span className="font-semibold text-gray-600 dark:text-gray-400">{systemDesignStats.remaining}</span>
                    </div>
                  </div>
                  <div className="h-64">
                    <Pie data={systemDesignPieData} options={pieOptions} />
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </section>

      {/* Achievements Section */}
      <section className="py-16 bg-white dark:bg-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-bold text-center text-gray-800 dark:text-gray-100 mb-12"
          >
            Your Achievements
          </motion.h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Leetcode Achievements */}
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              className="p-6 bg-gray-50 dark:bg-slate-900 rounded-2xl shadow-lg"
            >
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center">
                <CodeBracketIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400 mr-2" />
                Leetcode Achievements
              </h3>
              <div className="space-y-6">
                {/* Solved Problems */}
                <div>
                  <h4 className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-4">Solved Problems</h4>
                  {leetcodeSolved.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                      {leetcodeSolved.map((item) => (
                        <motion.div
                          key={item.id}
                          whileHover={{ scale: 1.05 }}
                          className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow flex items-center justify-between"
                        >
                          <Link href={`/leetcode/${item.id}`} className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm font-medium truncate">
                            {item.title}
                          </Link>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            Solved
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">No problems solved yet.</p>
                  )}
                </div>
                {/* Tagged Problems */}
                <div>
                  <h4 className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-4">Tagged Problems</h4>
                  {leetcodeTagged.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                      {leetcodeTagged.map((item) => (
                        <motion.div
                          key={item.id}
                          whileHover={{ scale: 1.05 }}
                          className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow flex items-center justify-between"
                        >
                          <Link href={`/leetcode/${item.id}`} className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm font-medium truncate">
                            {item.title}
                          </Link>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200">
                            Tagged
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">No problems tagged yet.</p>
                  )}
                </div>
              </div>
            </motion.div>
            {/* System Design Achievements */}
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              className="p-6 bg-gray-50 dark:bg-slate-900 rounded-2xl shadow-lg"
            >
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center">
                <RocketLaunchIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400 mr-2" />
                System Design Achievements
              </h3>
              <div className="space-y-4">
                {/* Solved Articles */}
                <div>
                  <button
                    onClick={() => toggleAccordion("solved")}
                    className="w-full flex justify-between items-center text-lg font-medium text-gray-700 dark:text-gray-200 mb-2 focus:outline-none"
                  >
                    <span>Solved Articles</span>
                    <svg
                      className={`w-5 h-5 transform transition-transform ${openAccordion === "solved" ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <AnimatePresence>
                    {openAccordion === "solved" && (
                      <motion.div
                        variants={accordionVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        className="overflow-hidden"
                      >
                        {systemDesignSolved.length > 0 ? (
                          <ul className="space-y-2 max-h-60 overflow-y-auto text-gray-600 dark:text-gray-300">
                            {systemDesignSolved.map((item) => (
                              <li key={item.id} className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/50 p-3 rounded-md">
                                <Link href={`/system-design/${item.id}`} className="text-blue-600 dark:text-blue-400 hover:underline text-sm truncate">
                                  {item.title}
                                </Link>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                  Solved
                                </span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-gray-500 dark:text-gray-400">No articles solved yet.</p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                {/* Viewed Articles */}
                <div>
                  <button
                    onClick={() => toggleAccordion("viewed")}
                    className="w-full flex justify-between items-center text-lg font-medium text-gray-700 dark:text-gray-200 mb-2 focus:outline-none"
                  >
                    <span>Viewed Articles</span>
                    <svg
                      className={`w-5 h-5 transform transition-transform ${openAccordion === "viewed" ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <AnimatePresence>
                    {openAccordion === "viewed" && (
                      <motion.div
                        variants={accordionVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        className="overflow-hidden"
                      >
                        {systemDesignViewed.length > 0 ? (
                          <ul className="space-y-2 max-h-60 overflow-y-auto text-gray-600 dark:text-gray-300">
                            {systemDesignViewed.map((item) => (
                              <li key={item.id} className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/50 p-3 rounded-md">
                                <Link href={`/system-design/${item.id}`} className="text-blue-600 dark:text-blue-400 hover:underline text-sm truncate">
                                  {item.title}
                                </Link>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                  Viewed
                                </span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-gray-500 dark:text-gray-400">No articles viewed yet.</p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                {/* Tagged Articles */}
                <div>
                  <button
                    onClick={() => toggleAccordion("tagged")}
                    className="w-full flex justify-between items-center text-lg font-medium text-gray-700 dark:text-gray-200 mb-2 focus:outline-none"
                  >
                    <span>Tagged Articles</span>
                    <svg
                      className={`w-5 h-5 transform transition-transform ${openAccordion === "tagged" ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <AnimatePresence>
                    {openAccordion === "tagged" && (
                      <motion.div
                        variants={accordionVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        className="overflow-hidden"
                      >
                        {systemDesignTagged.length > 0 ? (
                          <ul className="space-y-2 max-h-60 overflow-y-auto text-gray-600 dark:text-gray-300">
                            {systemDesignTagged.map((item) => (
                              <li key={item.id} className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/50 p-3 rounded-md">
                                <Link href={`/system-design/${item.id}`} className="text-blue-600 dark:text-blue-400 hover:underline text-sm truncate">
                                  {item.title}
                                </Link>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200">
                                  Tagged
                                </span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-gray-500 dark:text-gray-400">No articles tagged yet.</p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </Layout>
  );
}

export async function getServerSideProps(context) {
  const session = await getSession(context);

  if (!session) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  return {
    props: {
      totalLeetcodeQuestions: problems.length,
      totalSystemDesignQuestions: systemDesignQuestions.length,
    },
  };
}