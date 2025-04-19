import { useState, useEffect, useCallback, useMemo } from "react";
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
import debounce from "lodash/debounce";

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

// Constants
const MAX_TITLE_LENGTH = 50;
const CHART_HEIGHT = "72";
const API_ENDPOINTS = {
  PROGRESS_CHECK: process.env.NEXT_PUBLIC_API_BASE_URL
    ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/user/progress/check`
    : "/api/user/progress/check",
};
const COLORS = {
  solved: "#4f46e5",
  viewed: "#2563eb",
  tagged: "#db2777",
  remaining: "#e5e7eb",
  border: "#ffffff",
};

// Utility to trim titles
const trimTitle = (title, maxLength = MAX_TITLE_LENGTH) => {
  if (!title) return "Unknown";
  return title.length > maxLength ? `${title.slice(0, maxLength - 3)}...` : title;
};

// Skeleton loader component (Moved above ProgressCard)
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

// Reusable Progress Card Component
const ProgressCard = ({ title, icon, stats, total, pieData, isLoading }) => {
  const [legendColor, setLegendColor] = useState("#1f2937"); // Default to light mode color

  // Detect theme changes
  useEffect(() => {
    const updateLegendColor = () => {
      const isDarkMode = document.documentElement.classList.contains("dark");
      setLegendColor(isDarkMode ? "#ffffff" : "#1f2937");
    };

    // Initial check
    updateLegendColor();

    // Listen for theme changes
    const observer = new MutationObserver(updateLegendColor);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    // Cleanup
    return () => observer.disconnect();
  }, []);

  const pieOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: legendColor,
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
        // Accessibility: Provide data summary for screen readers
        datalabels: {
          display: false, // Requires chartjs-plugin-datalabels
        },
      },
    }),
    [legendColor]
  );

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
      }}
      initial="hidden"
      animate="visible"
      className="p-8 bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-700 rounded-3xl shadow-xl"
    >
      <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
        {icon}
        {title}
      </h3>
      {isLoading ? (
        <SkeletonLoader />
      ) : (
        <div className="space-y-6">
          {["solved", "viewed", "tagged"].map((key) => (
            <div key={key}>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600 dark:text-gray-300 font-medium capitalize">{key}</span>
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                  {stats[key]}/{key === "solved" ? total : stats[key]}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-3">
                <motion.div
                  className="h-3 rounded-full"
                  style={{ backgroundColor: COLORS[key] }}
                  initial={{ width: 0 }}
                  animate={{ width: `${(stats[key] / total) * 100}%` }}
                  transition={{ duration: 0.7 }}
                />
              </div>
            </div>
          ))}
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600 dark:text-gray-300 font-medium">Remaining</span>
              <span className="font-semibold text-gray-600 dark:text-gray-400">{stats.remaining}</span>
            </div>
          </div>
          <div className={`h-${CHART_HEIGHT}`}>
            <Pie
              data={pieData}
              options={pieOptions}
              aria-label={`${title} progress chart: Solved ${stats.solved}, Viewed ${stats.viewed}, Tagged ${stats.tagged}, Remaining ${stats.remaining}`}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
};

// Reusable Achievement Section Component
const AchievementSection = ({ title, icon, items, type, emptyMessage }) => (
  <motion.div
    variants={{
      hidden: { opacity: 0, y: 30 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
    }}
    initial="hidden"
    animate="visible"
    className="p-8 bg-gradient-to-br from-gray-50 to-white dark:from-slate-900 dark:to-slate-800 rounded-3xl shadow-xl"
  >
    <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
      {icon}
      {title}
    </h3>
    <div className="space-y-8">
      {["solved", "tagged", "viewed"].map((status) => (
        <div key={status}>
          <h4 className="text-xl font-medium text-gray-700 dark:text-gray-200 mb-4 capitalize">{status} {type}</h4>
          {items[status].length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-96 overflow-y-auto pr-2">
              {items[status].map((item) => (
                <motion.div
                  key={item.id}
                  whileHover={{ scale: 1.03 }}
                  className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm hover:shadow-lg transition-shadow flex items-center justify-between border border-gray-100 dark:border-slate-700"
                >
                  <Link
                    href={`/${type}/${item.id}`}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm font-medium truncate"
                    aria-label={`View ${item.title}`}
                  >
                    {item.title}
                  </Link>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      status === "solved"
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : status === "tagged"
                        ? "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200"
                        : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </span>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">
              {emptyMessage[status]}{" "}
              <Link
                href={`/${type}`}
                className="text-indigo-600 dark:text-indigo-400 hover:underline"
                aria-label={`Explore ${type} ${status}`}
              >
                Explore now
              </Link>
            </p>
          )}
        </div>
      ))}
      </div>
    </motion.div>
);

export default function Profile({ totalLeetcodeQuestions, totalSystemDesignQuestions }) {
  const { data: session, status } = useSession();
  const [userName, setUserName] = useState("");
  const [progress, setProgress] = useState({
    leetcode: { viewed: [], solved: [], tagged: [] },
    systemdesign: { viewed: [], solved: [], tagged: [] },
  });
  const [isLoadingProgress, setIsLoadingProgress] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Memoized stats
  const leetcodeStats = useMemo(
    () => ({
      viewed: progress.leetcode.viewed.length,
      solved: progress.leetcode.solved.length,
      tagged: progress.leetcode.tagged.length,
      remaining: totalLeetcodeQuestions - progress.leetcode.solved.length,
    }),
    [progress.leetcode, totalLeetcodeQuestions]
  );

  const systemDesignStats = useMemo(
    () => ({
      viewed: progress.systemdesign.viewed.length,
      solved: progress.systemdesign.solved.length,
      tagged: progress.systemdesign.tagged.length,
      remaining: totalSystemDesignQuestions - progress.systemdesign.solved.length,
    }),
    [progress.systemdesign, totalSystemDesignQuestions]
  );

  // Memoized mapped items
  const leetcodeItems = useMemo(
    () => ({
      viewed: progress.leetcode.viewed.map((id) => ({
        id,
        title: trimTitle(problems.find((p) => p.id === id)?.title || `Problem ${id}`),
      })),
      solved: progress.leetcode.solved.map((id) => ({
        id,
        title: trimTitle(problems.find((p) => p.id === id)?.title || `Problem ${id}`),
      })),
      tagged: progress.leetcode.tagged.map((id) => ({
        id,
        title: trimTitle(problems.find((p) => p.id === id)?.title || `Problem ${id}`),
      })),
    }),
    [progress.leetcode]
  );

  const systemDesignItems = useMemo(
    () => ({
      viewed: progress.systemdesign.viewed.map((id) => ({
        id,
        title: trimTitle(systemDesignQuestions.find((q) => q.id === id)?.title || `Article ${id}`),
      })),
      solved: progress.systemdesign.solved.map((id) => ({
        id,
        title: trimTitle(systemDesignQuestions.find((q) => q.id === id)?.title || `Article ${id}`),
      })),
      tagged: progress.systemdesign.solved.map((id) => ({
        id,
        title: trimTitle(systemDesignQuestions.find((q) => q.id === id)?.title || `Article ${id}`),
      })),
    }),
    [progress.systemdesign]
  );

  // Pie chart data
  const leetcodePieData = useMemo(
    () => ({
      labels: ["Viewed", "Solved", "Tagged", "Remaining"],
      datasets: [
        {
          data: [
            leetcodeStats.viewed,
            leetcodeStats.solved,
            leetcodeStats.tagged,
            leetcodeStats.remaining,
          ],
          backgroundColor: [COLORS.viewed, COLORS.solved, COLORS.tagged, COLORS.remaining],
          borderColor: [COLORS.border, COLORS.border, COLORS.border, COLORS.border],
          borderWidth: 2,
        },
      ],
    }),
    [leetcodeStats]
  );

  const systemDesignPieData = useMemo(
    () => ({
      labels: ["Solved", "Viewed", "Tagged", "Remaining"],
      datasets: [
        {
          data: [
            systemDesignStats.solved,
            systemDesignStats.viewed,
            systemDesignStats.tagged,
            systemDesignStats.remaining,
          ],
          backgroundColor: [COLORS.solved, COLORS.viewed, COLORS.tagged, COLORS.remaining],
          borderColor: [COLORS.border, COLORS.border, COLORS.border, COLORS.border],
          borderWidth: 2,
        },
      ],
    }),
    [systemDesignStats]
  );

  // Debounced fetch progress
  const fetchProgress = useCallback(
    debounce(async () => {
      setIsLoadingProgress(true);
      setIsRefreshing(true);
      try {
        const response = await fetch(API_ENDPOINTS.PROGRESS_CHECK, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "all", action: "all" }),
        });
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || `HTTP error: ${response.status}`);
        }
        const data = await response.json();
        if (!data || typeof data !== "object") {
          throw new Error("Invalid API response");
        }
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
      } catch (error) {
        console.error("Fetch progress error:", error.message);
        toast.error("Error loading progress");
      } finally {
        setIsLoadingProgress(false);
        setIsRefreshing(false);
      }
    }, 300),
    []
  );

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      setUserName(session.user.name || session.user.email?.split("@")[0] || "User");
      fetchProgress();
    } else {
      setUserName("");
      setProgress({
        leetcode: { viewed: [], solved: [], tagged: [] },
        systemdesign: { viewed: [], solved: [], tagged: [] },
      });
    }
  }, [status, session, fetchProgress]);

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50 dark:bg-slate-900">
        <svg
          className="animate-spin h-10 w-10 text-indigo-600 dark:text-indigo-400"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-label="Loading profile"
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

  // Dynamic base URL for meta tags
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://leetcodesolve.vercel.app";

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
        <meta property="og:url" content={`${baseUrl}/profile`} />
        <meta property="og:image" content={`${baseUrl}/og-image.jpg`} />
        <meta property="og:image:alt" content="LeetcodeSolve user profile preview" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="LeetcodeSolve - Your Profile" />
        <meta
          name="twitter:description"
          content="Visualize your Leetcode and system design progress with charts and detailed lists."
        />
        <meta name="twitter:image" content={`${baseUrl}/twitter-image.jpg`} />
        <meta name="twitter:image:alt" content="LeetcodeSolve user profile preview" />
        <link rel="canonical" href={`${baseUrl}/profile`} />
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
                url: `${baseUrl}/profile`,
                description:
                  "View your progress on Leetcode problems and system design articles, including solved, tagged, and viewed items.",
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
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
            }}
            initial="hidden"
            animate="visible"
            className="bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-700 rounded-3xl shadow-xl p-8"
          >
            <div className="flex items-center space-x-6">
              <UserIcon className="w-16 h-16 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {userName}
                </h2>
                <p className="text-gray-600 dark:text-gray-300 text-lg">
                  {session?.user?.email || "No email provided"}
                </p>
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
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              aria-label="Refresh progress data"
            >
              <ArrowPathIcon
                className={`w-5 h-5 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
                aria-hidden="true"
              />
              Refresh Progress
            </motion.button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ProgressCard
              title="Leetcode Progress"
              icon={<CodeBracketIcon className="w-8 h-8 text-indigo-600 dark:text-indigo-400 mr-3" aria-hidden="true" />}
              stats={leetcodeStats}
              total={totalLeetcodeQuestions}
              pieData={leetcodePieData}
              isLoading={isLoadingProgress}
            />
            <ProgressCard
              title="System Design Progress"
              icon={<RocketLaunchIcon className="w-8 h-8 text-indigo-600 dark:text-indigo-400 mr-3" aria-hidden="true" />}
              stats={systemDesignStats}
              total={totalSystemDesignQuestions}
              pieData={systemDesignPieData}
              isLoading={isLoadingProgress}
            />
          </div>
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
            <AchievementSection
              title="Leetcode Achievements"
              icon={<CodeBracketIcon className="w-8 h-8 text-indigo-600 dark:text-indigo-400 mr-3" aria-hidden="true" />}
              items={leetcodeItems}
              type="leetcode"
              emptyMessage={{
                solved: "No problems solved yet.",
                tagged: "No problems tagged yet.",
                viewed: "No problems viewed yet.",
              }}
            />
            <AchievementSection
              title="System Design Achievements"
              icon={<RocketLaunchIcon className="w-8 h-8 text-indigo-600 dark:text-indigo-400 mr-3" aria-hidden="true" />}
              items={systemDesignItems}
              type="system-design"
              emptyMessage={{
                solved: "No articles solved yet.",
                tagged: "No articles tagged yet.",
                viewed: "No articles viewed yet.",
              }}
            />
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
      totalLeetcodeQuestions: problems.length || 0,
      totalSystemDesignQuestions: systemDesignQuestions.length || 0,
    },
  };
}