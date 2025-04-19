import { useState, useEffect, useCallback } from "react";
import { useSession, getSession } from "next-auth/react";
import Head from "next/head";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { toast, Toaster } from "react-hot-toast";
import { UserIcon, CodeBracketIcon, RocketLaunchIcon, ArrowPathIcon } from "@heroicons/react/24/solid";
import DOMPurify from "isomorphic-dompurify";
import Layout from "../components/Layout";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import problems from "../data/problems.json";
import systemDesignQuestions from "../data/system_design_questions.json";

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

// Utility to trim titles
const trimTitle = (title, maxLength = 50) => {
  if (title.length > maxLength) {
    return title.slice(0, maxLength - 3) + "...";
  }
  return title;
};

export default function Profile({ totalLeetcodeQuestions, totalSystemDesignQuestions }) {
  const { data: session, status } = useSession();
  const [userName, setUserName] = useState("");
  const [progress, setProgress] = useState({
    leetcode: { viewed: [], solved: [], tagged: [] },
    systemdesign: { viewed: [], solved: [], tagged: [] },
  });
  const [isLoadingProgress, setIsLoadingProgress] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch user progress
  const fetchProgress = useCallback(async () => {
    setIsLoadingProgress(true);
    setIsRefreshing(true);
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
            viewed: (data.leetcode?.viewed || []).map(Number),
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
      setIsRefreshing(false);
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
    viewed: progress.leetcode.viewed.length || 0,
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
  const leetcodeViewed = progress.leetcode.viewed.map((id) => ({
    id,
    title: trimTitle(problems.find((p) => p.id === id)?.title || `Problem ${id}`),
  }));
  const leetcodeSolved = progress.leetcode.solved.map((id) => ({
    id,
    title: trimTitle(problems.find((p) => p.id === id)?.title || `Problem ${id}`),
  }));
  const leetcodeTagged = progress.leetcode.tagged.map((id) => ({
    id,
    title: trimTitle(problems.find((p) => p.id === id)?.title || `Problem ${id}`),
  }));
  const systemDesignSolved = progress.systemdesign.solved.map((id) => ({
    id,
    title: trimTitle(systemDesignQuestions.find((q) => q.id === id)?.title || `Article ${id}`),
  }));
  const systemDesignViewed = progress.systemdesign.viewed.map((id) => ({
    id,
    title: trimTitle(systemDesignQuestions.find((q) => q.id === id)?.title || `Article ${id}`),
  }));
  const systemDesignTagged = progress.systemdesign.tagged.map((id) => ({
    id,
    title: trimTitle(systemDesignQuestions.find((q) => q.id === id)?.title || `Article ${id}`),
  }));

  // Pie chart data
  const leetcodePieData = {
    labels: ["Viewed", "Solved", "Tagged", "Remaining"],
    datasets: [
      {
        data: [leetcodeStats.viewed, leetcodeStats.solved, leetcodeStats.tagged, leetcodeStats.remaining],
        backgroundColor: ["#2563eb","#4f46e5", "#db2777", "#e5e7eb"],
        borderColor: ["#ffffff", "#ffffff", "#ffffff", "#ffffff"],
        borderWidth: 2,
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
        borderWidth: 2,
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
          color: typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches ? "#ffff" : "#bbbbbb",
          font: { size: 14, weight: "bold" },
          padding: 20,
          boxWidth: 10,
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.9)",
        titleFont: { size: 16, weight: "bold" },
        bodyFont: { size: 14 },
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (context) => `${context.label}: ${context.raw}`,
        },
      },
    },
  };

  // Animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  // Skeleton loader component
  const SkeletonLoader = () => (
    <div className="animate-pulse space-y-6">
      <div className="h-8 bg-gray-200 dark:bg-slate-700 rounded w-1/3"></div>
      <div className="space-y-4">
        <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-full"></div>
        <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/2"></div>
      </div>
      <div className="h-64 bg-gray-200 dark:bg-slate-700 rounded"></div>
    </div>
  );

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50 dark:bg-slate-900">
        <svg
          className="animate-spin h-10 w-10 text-indigo-600 dark:text-indigo-400"
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
          content="Track your progress on Leetcode problems and system design articles with a beautifully designed profile page."
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
      <section className="py-20 bg-gradient-to-br from-indigo-50 to-gray-100 dark:from-slate-900 dark:to-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white mb-6"
          >
            Welcome, <span className="text-indigo-600 dark:text-indigo-400">{userName}</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto"
          >
            Monitor your coding journey, celebrate your achievements, and plan your next steps with LeetcodeSolve.
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
            className="bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-700 rounded-3xl shadow-xl p-8"
          >
            <div className="flex items-center space-x-6">
              <UserIcon className="w-16 h-16 text-indigo-600 dark:text-indigo-400" />
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {session?.user.name || "User"}
                </h2>
                <p className="text-gray-600 dark:text-gray-300 text-lg">{session?.user.email}</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Progress Section */}
      <section className="py-16 bg-gray-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-12">
            <motion.h2
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-4xl font-bold text-gray-900 dark:text-white"
            >
              Your Progress
            </motion.h2>
            <motion.button
              onClick={fetchProgress}
              disabled={isRefreshing}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowPathIcon className={`w-5 h-5 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh Progress
            </motion.button>
          </div>
          {isLoadingProgress ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <SkeletonLoader />
              <SkeletonLoader />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Leetcode Progress */}
              <motion.div
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                className="p-8 bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-700 rounded-3xl shadow-xl"
              >
                <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                  <CodeBracketIcon className="w-8 h-8 text-indigo-600 dark:text-indigo-400 mr-3" />
                  Leetcode Progress
                </h3>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600 dark:text-gray-300 font-medium">Solved</span>
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">{leetcodeStats.solved}/{totalLeetcodeQuestions}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-3">
                      <motion.div
                        className="bg-indigo-600 h-3 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${(leetcodeStats.solved / totalLeetcodeQuestions) * 100}%` }}
                        transition={{ duration: 0.7 }}
                      ></motion.div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600 dark:text-gray-300 font-medium">Viewed</span>
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">{leetcodeStats.viewed}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-3">
                      <motion.div
                        className="bg-blue-600 h-3 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${(leetcodeStats.viewed / totalLeetcodeQuestions) * 100}%` }}
                        transition={{ duration: 0.7 }}
                      ></motion.div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600 dark:text-gray-300 font-medium">Tagged</span>
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">{leetcodeStats.tagged}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-3">
                      <motion.div
                        className="bg-pink-600 h-3 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${(leetcodeStats.tagged / totalLeetcodeQuestions) * 100}%` }}
                        transition={{ duration: 0.7 }}
                      ></motion.div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600 dark:text-gray-300 font-medium">Remaining</span>
                      <span className="font-semibold text-gray-600 dark:text-gray-400">{leetcodeStats.remaining}</span>
                    </div>
                  </div>
                  <div className="h-72">
                    <Pie data={leetcodePieData} options={pieOptions} />
                  </div>
                </div>
              </motion.div>
              {/* System Design Progress */}
              <motion.div
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                className="p-8 bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-700 rounded-3xl shadow-xl"
              >
                <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                  <RocketLaunchIcon className="w-8 h-8 text-indigo-600 dark:text-indigo-400 mr-3" />
                  System Design Progress
                </h3>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600 dark:text-gray-300 font-medium">Solved</span>
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">{systemDesignStats.solved}/{totalSystemDesignQuestions}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-3">
                      <motion.div
                        className="bg-indigo-600 h-3 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${(systemDesignStats.solved / totalSystemDesignQuestions) * 100}%` }}
                        transition={{ duration: 0.7 }}
                      ></motion.div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600 dark:text-gray-300 font-medium">Viewed</span>
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">{systemDesignStats.viewed}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-3">
                      <motion.div
                        className="bg-blue-600 h-3 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${(systemDesignStats.viewed / totalSystemDesignQuestions) * 100}%` }}
                        transition={{ duration: 0.7 }}
                      ></motion.div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600 dark:text-gray-300 font-medium">Tagged</span>
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">{systemDesignStats.tagged}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-3">
                      <motion.div
                        className="bg-pink-600 h-3 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${(systemDesignStats.tagged / totalSystemDesignQuestions) * 100}%` }}
                        transition={{ duration: 0.7 }}
                      ></motion.div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600 dark:text-gray-300 font-medium">Remaining</span>
                      <span className="font-semibold text-gray-600 dark:text-gray-400">{systemDesignStats.remaining}</span>
                    </div>
                  </div>
                  <div className="h-72">
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
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl font-bold text-gray-900 dark:text-white mb-12"
          >
            Your Achievements
          </motion.h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Leetcode Achievements */}
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              className="p-8 bg-gradient-to-br from-gray-50 to-white dark:from-slate-900 dark:to-slate-800 rounded-3xl shadow-xl"
            >
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                <CodeBracketIcon className="w-8 h-8 text-indigo-600 dark:text-indigo-400 mr-3" />
                Leetcode Achievements
              </h3>
              <div className="space-y-8">
                {/* Solved Problems */}
                <div>
                  <h4 className="text-xl font-medium text-gray-700 dark:text-gray-200 mb-4">Solved Problems</h4>
                  {leetcodeSolved.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-96 overflow-y-auto pr-2">
                      {leetcodeSolved.map((item) => (
                        <motion.div
                          key={item.id}
                          whileHover={{ scale: 1.03 }}
                          className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm hover:shadow-lg transition-shadow flex items-center justify-between border border-gray-100 dark:border-slate-700"
                        >
                          <Link href={`/leetcode/${item.id}`} className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm font-medium truncate">
                            {item.title}
                          </Link>
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
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
                  <h4 className="text-xl font-medium text-gray-700 dark:text-gray-200 mb-4">Tagged Problems</h4>
                  {leetcodeTagged.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-96 overflow-y-auto pr-2">
                      {leetcodeTagged.map((item) => (
                        <motion.div
                          key={item.id}
                          whileHover={{ scale: 1.03 }}
                          className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm hover:shadow-lg transition-shadow flex items-center justify-between border border-gray-100 dark:border-slate-700"
                        >
                          <Link href={`/leetcode/${item.id}`} className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm font-medium truncate">
                            {item.title}
                          </Link>
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200">
                            Tagged
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">No problems tagged yet.</p>
                  )}
                </div>
                {/* Viewed Articles */}
                <div>
                  <h4 className="text-xl font-medium text-gray-700 dark:text-gray-200 mb-4">Viewed Problems</h4>
                  {leetcodeViewed.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-96 overflow-y-auto pr-2">
                      {leetcodeViewed.map((item) => (
                        <motion.div
                          key={item.id}
                          whileHover={{ scale: 1.03 }}
                          className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm hover:shadow-lg transition-shadow flex items-center justify-between border border-gray-100 dark:border-slate-700"
                        >
                          <Link href={`/leetcode/${item.id}`} className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm font-medium truncate">
                            {item.title}
                          </Link>
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            Viewed
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">No Problems viewed yet.</p>
                  )}
                </div>
              </div>
            </motion.div>
            {/* System Design Achievements */}
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              className="p-8 bg-gradient-to-br from-gray-50 to-white dark:from-slate-900 dark:to-slate-800 rounded-3xl shadow-xl"
            >
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                <RocketLaunchIcon className="w-8 h-8 text-indigo-600 dark:text-indigo-400 mr-3" />
                System Design Achievements
              </h3>
              <div className="space-y-8">
                {/* Solved Articles */}
                <div>
                  <h4 className="text-xl font-medium text-gray-700 dark:text-gray-200 mb-4">Solved Articles</h4>
                  {systemDesignSolved.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-96 overflow-y-auto pr-2">
                      {systemDesignSolved.map((item) => (
                        <motion.div
                          key={item.id}
                          whileHover={{ scale: 1.03 }}
                          className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm hover:shadow-lg transition-shadow flex items-center justify-between border border-gray-100 dark:border-slate-700"
                        >
                          <Link href={`/system-design/${item.id}`} className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm font-medium truncate">
                            {item.title}
                          </Link>
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            Solved
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">No articles solved yet.</p>
                  )}
                </div>
                {/* Tagged Articles */}
                <div>
                  <h4 className="text-xl font-medium text-gray-700 dark:text-gray-200 mb-4">Tagged Articles</h4>
                  {systemDesignTagged.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-96 overflow-y-auto pr-2">
                      {systemDesignTagged.map((item) => (
                        <motion.div
                          key={item.id}
                          whileHover={{ scale: 1.03 }}
                          className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm hover:shadow-lg transition-shadow flex items-center justify-between border border-gray-100 dark:border-slate-700"
                        >
                          <Link href={`/system-design/${item.id}`} className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm font-medium truncate">
                            {item.title}
                          </Link>
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200">
                            Tagged
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">No articles tagged yet.</p>
                  )}
                </div>
                {/* Viewed Articles */}
                <div>
                  <h4 className="text-xl font-medium text-gray-700 dark:text-gray-200 mb-4">Viewed Articles</h4>
                  {systemDesignViewed.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-96 overflow-y-auto pr-2">
                      {systemDesignViewed.map((item) => (
                        <motion.div
                          key={item.id}
                          whileHover={{ scale: 1.03 }}
                          className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm hover:shadow-lg transition-shadow flex items-center justify-between border border-gray-100 dark:border-slate-700"
                        >
                          <Link href={`/system-design/${item.id}`} className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm font-medium truncate">
                            {item.title}
                          </Link>
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            Viewed
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">No articles viewed yet.</p>
                  )}
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