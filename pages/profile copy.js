import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
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

export default function Profile() {
  const { data: session, status } = useSession();
  const [progress, setProgress] = useState({
    leetcode: { solved: [], tagged: [] },
    systemdesign: { viewed: [], solved: [], tagged: [] },
  });
  const [isLoadingProgress, setIsLoadingProgress] = useState(false);

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
      fetchProgress();
    }
  }, [status, fetchProgress]);

  // Calculate progress stats
  const leetcodeStats = {
    solved: progress.leetcode.solved.length,
    tagged: progress.leetcode.tagged.length,
    remaining: problems.length - progress.leetcode.solved.length,
  };
  const systemDesignStats = {
    viewed: progress.systemdesign.viewed.length,
    solved: progress.systemdesign.solved.length,
    tagged: progress.systemdesign.tagged.length,
    remaining: systemDesignQuestions.length - progress.systemdesign.solved.length,
  };

  // Pie chart data
  const leetcodeChartData = {
    labels: ["Solved", "Tagged", "Remaining"],
    datasets: [
      {
        data: [leetcodeStats.solved, leetcodeStats.tagged, leetcodeStats.remaining],
        backgroundColor: ["#34D399", "#F472B6", "#E5E7EB"],
        borderColor: ["#34D399", "#F472B6", "#E5E7EB"],
        borderWidth: 1,
      },
    ],
  };
  const systemDesignChartData = {
    labels: ["Viewed", "Solved", "Tagged", "Remaining"],
    datasets: [
      {
        data: [
          systemDesignStats.viewed,
          systemDesignStats.solved,
          systemDesignStats.tagged,
          systemDesignStats.remaining,
        ],
        backgroundColor: ["#3B82F6", "#34D399", "#F472B6", "#E5E7EB"],
        borderColor: ["#3B82F6", "#34D399", "#F472B6", "#E5E7EB"],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          color: "rgb(31, 41, 55)",
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
      },
    },
  };

  // Animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <Layout>
      <Head>
        <title>Profile | LeetcodeSolve</title>
        <meta
          name="description"
          content="View your LeetcodeSolve profile, track your progress with pie charts, and review solved, tagged, and viewed questions."
        />
        <meta
          name="keywords"
          content="LeetcodeSolve profile, user progress, coding progress, system design progress, pie charts"
        />
        <meta name="author" content="LeetcodeSolve Team" />
        <meta name="robots" content="index, follow" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta property="og:title" content="Profile | LeetcodeSolve" />
        <meta
          property="og:description"
          content="Track your coding and system design progress with detailed stats and pie charts on LeetcodeSolve."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://leetcodesolve.vercel.app/profile" />
        <meta
          property="og:image"
          content="https://leetcodesolve.vercel.app/og-image.jpg"
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Profile | LeetcodeSolve" />
        <meta
          name="twitter:description"
          content="Monitor your Leetcode and System Design progress with interactive pie charts and detailed question lists."
        />
        <meta
          name="twitter:image"
          content="https://leetcodesolve.vercel.app/twitter-image.jpg"
        />
        <link rel="canonical" href="https://leetcodesolve.vercel.app/profile" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(
              JSON.stringify({
                "@context": "https://schema.org",
                "@type": "ProfilePage",
                "url": "https://leetcodesolve.vercel.app/profile",
                "name": "User Profile - LeetcodeSolve",
                "description": "Track your coding and system design progress on LeetcodeSolve.",
                "publisher": {
                  "@type": "Organization",
                  "name": "LeetcodeSolve Team",
                },
              })
            ),
          }}
        />
      </Head>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {status === "authenticated" ? (
          <div className="space-y-12">
            {/* User Details */}
            <motion.section
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6"
            >
              <div className="flex items-center space-x-4">
                <UserIcon className="w-12 h-12 text-indigo-600 dark:text-indigo-400" />
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                    {session.user.name || "User"}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300">{session.user.email}</p>
                </div>
              </div>
            </motion.section>

            {/* Progress Section */}
            <section>
              <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-8">
                Your Progress
              </h2>
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
                    className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6"
                  >
                    <div className="flex items-center space-x-2 mb-4">
                      <CodeBracketIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                      <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                        Leetcode Progress
                      </h3>
                    </div>
                    <div className="h-64">
                      <Pie data={leetcodeChartData} options={chartOptions} />
                    </div>
                    <div className="mt-4 space-y-2">
                      <p className="text-gray-600 dark:text-gray-300">
                        Solved: <span className="font-semibold text-indigo-600 dark:text-indigo-400">{leetcodeStats.solved}</span> / {problems.length}
                      </p>
                      <p className="text-gray-600 dark:text-gray-300">
                        Tagged: <span className="font-semibold text-indigo-600 dark:text-indigo-400">{leetcodeStats.tagged}</span>
                      </p>
                      <p className="text-gray-600 dark:text-gray-300">
                        Remaining: <span className="font-semibold text-gray-600 dark:text-gray-400">{leetcodeStats.remaining}</span>
                      </p>
                    </div>
                  </motion.div>

                  {/* System Design Progress */}
                  <motion.div
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6"
                  >
                    <div className="flex items-center space-x-2 mb-4">
                      <RocketLaunchIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                      <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                        System Design Progress
                      </h3>
                    </div>
                    <div className="h-64">
                      <Pie data={systemDesignChartData} options={chartOptions} />
                    </div>
                    <div className="mt-4 space-y-2">
                      <p className="text-gray-600 dark:text-gray-300">
                        Viewed: <span className="font-semibold text-indigo-600 dark:text-indigo-400">{systemDesignStats.viewed}</span>
                      </p>
                      <p className="text-gray-600 dark:text-gray-300">
                        Solved: <span className="font-semibold text-indigo-600 dark:text-indigo-400">{systemDesignStats.solved}</span> / {systemDesignQuestions.length}
                      </p>
                      <p className="text-gray-600 dark:text-gray-300">
                        Tagged: <span className="font-semibold text-indigo-600 dark:text-indigo-400">{systemDesignStats.tagged}</span>
                      </p>
                      <p className="text-gray-600 dark:text-gray-300">
                        Remaining: <span className="font-semibold text-gray-600 dark:text-gray-400">{systemDesignStats.remaining}</span>
                      </p>
                    </div>
                  </motion.div>
                </div>
              )}
            </section>

            {/* Question Lists */}
            <section>
              <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-8">
                Your Questions
              </h2>
              <div className="space-y-12">
                {/* Leetcode Questions */}
                <motion.div
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6"
                >
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
                    Leetcode Questions
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-2">
                        Solved
                      </h4>
                      {progress.leetcode.solved.length > 0 ? (
                        <ul className="space-y-2 max-h-60 overflow-y-auto">
                          {progress.leetcode.solved.map((id) => {
                            const problem = problems.find((p) => p.id === id);
                            return problem ? (
                              <li key={id}>
                                <Link
                                  href={`/leetcode/${id}`}
                                  className="text-indigo-600 dark:text-indigo-400 hover:underline"
                                >
                                  {id}. {problem.title}
                                </Link>
                              </li>
                            ) : null;
                          })}
                        </ul>
                      ) : (
                        <p className="text-gray-500 dark:text-gray-400">
                          No solved problems yet.
                        </p>
                      )}
                    </div>
                    <div>
                      <h4 className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-2">
                        Tagged
                      </h4>
                      {progress.leetcode.tagged.length > 0 ? (
                        <ul className="space-y-2 max-h-60 overflow-y-auto">
                          {progress.leetcode.tagged.map((id) => {
                            const problem = problems.find((p) => p.id === id);
                            return problem ? (
                              <li key={id}>
                                <Link
                                  href={`/leetcode/${id}`}
                                  className="text-indigo-600 dark:text-indigo-400 hover:underline"
                                >
                                  {id}. {problem.title}
                                </Link>
                              </li>
                            ) : null;
                          })}
                        </ul>
                      ) : (
                        <p className="text-gray-500 dark:text-gray-400">
                          No tagged problems yet.
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>

                {/* System Design Questions */}
                <motion.div
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6"
                >
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
                    System Design Questions
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <h4 className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-2">
                        Viewed
                      </h4>
                      {progress.systemdesign.viewed.length > 0 ? (
                        <ul className="space-y-2 max-h-60 overflow-y-auto">
                          {progress.systemdesign.viewed.map((id) => {
                            const question = systemDesignQuestions.find((q) => q.id === id);
                            return question ? (
                              <li key={id}>
                                <Link
                                  href={`/system-design/${id}`}
                                  className="text-indigo-600 dark:text-indigo-400 hover:underline"
                                >
                                  {question.title}
                                </Link>
                              </li>
                            ) : null;
                          })}
                        </ul>
                      ) : (
                        <p className="text-gray-500 dark:text-gray-400">
                          No viewed questions yet.
                        </p>
                      )}
                    </div>
                    <div>
                      <h4 className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-2">
                        Solved
                      </h4>
                      {progress.systemdesign.solved.length > 0 ? (
                        <ul className="space-y-2 max-h-60 overflow-y-auto">
                          {progress.systemdesign.solved.map((id) => {
                            const question = systemDesignQuestions.find((q) => q.id === id);
                            return question ? (
                              <li key={id}>
                                <Link
                                  href={`/system-design/${id}`}
                                  className="text-indigo-600 dark:text-indigo-400 hover:underline"
                                >
                                  {question.title}
                                </Link>
                              </li>
                            ) : null;
                          })}
                        </ul>
                      ) : (
                        <p className="text-gray-500 dark:text-gray-400">
                          No solved questions yet.
                        </p>
                      )}
                    </div>
                    <div>
                      <h4 className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-2">
                        Tagged
                      </h4>
                      {progress.systemdesign.tagged.length > 0 ? (
                        <ul className="space-y-2 max-h-60 overflow-y-auto">
                          {progress.systemdesign.tagged.map((id) => {
                            const question = systemDesignQuestions.find((q) => q.id === id);
                            return question ? (
                              <li key={id}>
                                <Link
                                  href={`/system-design/${id}`}
                                  className="text-indigo-600 dark:text-indigo-400 hover:underline"
                                >
                                  {question.title}
                                </Link>
                              </li>
                            ) : null;
                          })}
                        </ul>
                      ) : (
                        <p className="text-gray-500 dark:text-gray-400">
                          No tagged questions yet.
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              </div>
            </section>
          </div>
        ) : (
          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className="text-center py-16"
          >
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
              Please Sign In
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-8">
              Sign in to view your profile and track your progress.
            </p>
            <Link href="/login">
              <motion.button
                className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 dark:from-indigo-800 dark:to-indigo-900 text-white rounded-lg text-lg font-semibold hover:bg-indigo-700 dark:hover:bg-indigo-500 transition shadow-md hover:scale-105 transform focus:outline-none focus:ring-2 focus:ring-indigo-500"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Sign in"
              >
                Sign In
              </motion.button>
            </Link>
          </motion.div>
        )}
      </main>
    </Layout>
  );
}