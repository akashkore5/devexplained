import Link from "next/link";
import Head from "next/head";
import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import Layout from "../components/Layout";
import { toast, Toaster } from "react-hot-toast";
import {
  CodeBracketIcon,
  ChartBarIcon,
  UsersIcon,
  PuzzlePieceIcon,
  RocketLaunchIcon,
  LightBulbIcon,
  ChatBubbleLeftRightIcon,
  BookOpenIcon,
  UserIcon,
  AcademicCapIcon,
  StarIcon,
} from "@heroicons/react/24/solid";
import DOMPurify from "isomorphic-dompurify";
import { useSession, signIn, signOut } from "next-auth/react";
import { getServerSession } from "next-auth/next";
import authOptions from "./api/auth/[...nextauth]";
import problems from "../data/problems.json";
import systemDesignQuestions from "../data/system_design_questions.json";
import Chart from "chart.js/auto";
import { ArcElement, Tooltip, Legend } from "chart.js";
import "react-responsive-carousel/lib/styles/carousel.min.css";

// Register Chart.js components
Chart.register(ArcElement, Tooltip, Legend);

// Lazy-load Pie component
const Pie = dynamic(() => import("react-chartjs-2").then((mod) => mod.Pie), { ssr: false });

// Lazy-load Carousel
const Carousel = dynamic(() => import("react-responsive-carousel").then((mod) => mod.Carousel), { ssr: false });

// Colors for charts
const COLORS = {
  solved: "#4f46e5",
  viewed: "#3b82f6",
  tagged: "#ec4899",
};

// Chart height
const CHART_HEIGHT = "64"; // Tailwind h-64 (256px)

export default function Home({
  initialLoggedIn = false,
  initialName = "",
  totalLeetcodeQuestions,
  totalSystemDesignQuestions,
  serverError = false,
}) {
  const { data: session, status } = useSession();
  const [email, setEmail] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(initialLoggedIn);
  const [userName, setUserName] = useState(initialName);
  const [progress, setProgress] = useState({
    leetcode: { viewed: [], solved: [], tagged: [] },
    systemdesign: { viewed: [], solved: [], tagged: [] },
  });
  const [isLoadingProgress, setIsLoadingProgress] = useState(false);
  const [quickStart, setQuickStart] = useState(null);
  const [legendColor, setLegendColor] = useState("#1f2937"); // Default light mode
  const [authError, setAuthError] = useState(serverError ? "Failed to connect to authentication service. Retrying..." : null);
  const [retryCount, setRetryCount] = useState(serverError ? 1 : 0);
  const maxRetries = 3;
  const retryDelay = 5000; // 5 seconds

  // Theme detection for chart legend
  useEffect(() => {
    const updateLegendColor = () => {
      const isDarkMode = document.documentElement.classList.contains("dark");
      setLegendColor(isDarkMode ? "#ffffff" : "#1f2937");
    };

    updateLegendColor();

    const observer = new MutationObserver(updateLegendColor);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect();
  }, []);

  // Handle session status and fetch progress
  useEffect(() => {
    if (status === "authenticated") {
      setIsLoggedIn(true);
      setUserName(session.user.name || "User");
      setAuthError(null);
      setRetryCount(0);
      fetchProgress();
    } else if (status === "unauthenticated") {
      setIsLoggedIn(false);
      setUserName("");
      setProgress({
        leetcode: { viewed: [], solved: [], tagged: [] },
        systemdesign: { viewed: [], solved: [], tagged: [] },
      });
    }
  }, [status, session]);

  // Retry logic for authentication errors
  useEffect(() => {
    if (authError && retryCount < maxRetries && status !== "authenticated") {
      const timer = setTimeout(() => {
        console.log(`Retrying session fetch (attempt ${retryCount}/${maxRetries})`);
        setRetryCount(retryCount + 1);
        signIn(null, { redirect: false }); // Silent retry
      }, retryDelay);

      return () => clearTimeout(timer);
    }
  }, [authError, retryCount, status]);

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
    }
  }, []);

  const fetchQuickStart = useCallback(() => {
    const isLeetcode = Math.random() > 0.5;
    const items = isLeetcode ? problems : systemDesignQuestions;
    const randomItem = items[Math.floor(Math.random() * items.length)];
    setQuickStart({
      type: isLeetcode ? "leetcode" : "system-design",
      id: randomItem.id,
      title: randomItem.title,
    });
  }, []);

  useEffect(() => {
    fetchQuickStart();
  }, [fetchQuickStart]);

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Email cannot be empty!");
      return;
    }
    if (!validateEmail(email)) {
      toast.error("Please enter a valid email!");
      return;
    }

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success(data.message);
        setEmail("");
      } else {
        toast.error(data.message || "Subscription failed");
      }
    } catch (error) {
      console.error("Subscribe error:", error);
      toast.error("Something went wrong. Please try again!");
    }
  };

  const handleSignIn = async (provider) => {
    try {
      await signIn(provider, { redirect: false });
    } catch (err) {
      console.error("Sign-in error:", err);
      setAuthError("Failed to connect to authentication service. Retrying...");
      setRetryCount(1);
    }
  };

  // Calculate progress stats
  const leetcodeStats = {
    viewed: progress.leetcode.viewed?.length || 0,
    solved: progress.leetcode.solved?.length || 0,
    tagged: progress.leetcode.tagged?.length || 0,
    remaining: totalLeetcodeQuestions - (progress.leetcode.solved?.length || 0),
  };
  const systemDesignStats = {
    viewed: progress.systemdesign.viewed?.length || 0,
    solved: progress.systemdesign.solved?.length || 0,
    tagged: progress.systemdesign.tagged?.length || 0,
    remaining: totalSystemDesignQuestions - (progress.systemdesign.solved?.length || 0),
  };

  // Pie chart data
  const leetcodePieData = useMemo(
    () => ({
      labels: ["Solved", "Tagged", "Viewed", "Remaining"],
      datasets: [
        {
          data: [leetcodeStats.solved, leetcodeStats.tagged, leetcodeStats.viewed, leetcodeStats.remaining],
          backgroundColor: [COLORS.solved, COLORS.tagged, COLORS.viewed, "#e5e7eb"],
          borderWidth: 1,
          borderColor: "#ffffff",
        },
      ],
    }),
    [leetcodeStats]
  );

  const systemDesignPieData = useMemo(
    () => ({
      labels: ["Solved", "Tagged", "Viewed", "Remaining"],
      datasets: [
        {
          data: [systemDesignStats.solved, systemDesignStats.tagged, systemDesignStats.viewed, systemDesignStats.remaining],
          backgroundColor: [COLORS.solved, COLORS.tagged, COLORS.viewed, "#e5e7eb"],
          borderWidth: 1,
          borderColor: "#ffffff",
        },
      ],
    }),
    [systemDesignStats]
  );

  const pieOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: legendColor,
            font: { size: 12, weight: "bold" },
            padding: 15,
            boxWidth: 8,
            usePointStyle: true,
          },
        },
        tooltip: {
          backgroundColor: "rgba(0, 0, 0, 0.9)",
          titleFont: { size: 14, weight: "bold" },
          bodyFont: { size: 12 },
          padding: 10,
          cornerRadius: 6,
          callbacks: {
            label: (context) => `${context.label}: ${context.raw}`,
          },
        },
      },
    }),
    [legendColor]
  );

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const iconVariants = {
    initial: { scale: 1 },
    hover: { scale: 1.2 },
    tap: { scale: 0.9 },
  };

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "DevExplained",
    url: "https://devexplained.vercel.app/",
    description: "Master coding interviews with expert Leetcode solutions, system design guides, and interview preparation resources.",
    publisher: {
      "@type": "Organization",
      name: "DevExplained Team",
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://devexplained.vercel.app/search?q={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
    mainEntity: [
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "How to solve Leetcode problems?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "DevExplained provides detailed Leetcode solutions in C++ and Python with step-by-step explanations to help you master algorithms and data structures.",
            },
          },
          {
            "@type": "Question",
            name: "What are system design questions?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "System design questions test your ability to architect scalable systems. DevExplained offers comprehensive guides on topics like URL shorteners and messaging apps.",
            },
          },
          {
            "@type": "Question",
            name: "How to prepare for coding interviews?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "DevExplained provides curated resources, progress tracking, and community support to help you excel in technical interviews.",
            },
          },
        ],
      },
      {
        "@type": "Course",
        name: "Leetcode Solutions Course",
        description: "Learn algorithms and data structures through expert Leetcode solutions in C++ and Python.",
        provider: {
          "@type": "Organization",
          name: "DevExplained",
          sameAs: "https://devexplained.vercel.app/",
        },
      },
      {
        "@type": "Course",
        name: "System Design Course",
        description: "Master scalable system design with tutorials on designing complex systems.",
        provider: {
          "@type": "Organization",
          name: "DevExplained",
          sameAs: "https://devexplained.vercel.app/",
        },
      },
    ],
  };

  // Render loading or error state
  if (status === "loading" || (authError && retryCount < maxRetries)) {
    return (
      <Layout isLoggedIn={false} userName="">
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
          <div className="text-center">
            <svg
              className="animate-spin h-8 w-8 text-indigo-600 dark:text-indigo-400 mx-auto"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <p className="text-gray-600 dark:text-gray-300 mt-4">
              {authError || "Loading..."}
            </p>
            {authError && <p className="text-gray-600 dark:text-gray-300 mt-2">Retrying in {retryDelay / 1000} seconds...</p>}
          </div>
        </div>
      </Layout>
    );
  }

  if (authError && retryCount >= maxRetries) {
    return (
      <Layout isLoggedIn={false} userName="">
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              Service temporarily unavailable. Please try again later.
            </p>
            <motion.button
              onClick={() => window.location.reload()}
              className="mt-4 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition shadow-md"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Refresh page"
            >
              Refresh Page
            </motion.button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout isLoggedIn={isLoggedIn} userName={userName}>
      <Head>
        <title>DevExplained - Leetcode Solutions & System Design Guides</title>
        <meta
          name="description"
          content="Ace coding interviews with DevExplained’s expert Leetcode solutions in C++ and Python, system design tutorials, and comprehensive interview prep resources."
        />
        <meta
          name="keywords"
          content="Leetcode solutions, system design questions, coding interviews, algorithms, data structures, C++, Python, interview preparation, technical interviews, coding tutorials, programming challenges"
        />
        <meta name="author" content="DevExplained Team" />
        <meta name="robots" content="index, follow" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta
          property="og:title"
          content="DevExplained - Leetcode Solutions & System Design Guides"
        />
        <meta
          property="og:description"
          content="Master technical interviews with expert Leetcode solutions, system design tutorials, and coding challenges."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://devexplained.vercel.app/" />
        <meta
          property="og:image"
          content="https://devexplained.vercel.app/og-image.jpg"
        />
        <meta
          property="og:image:alt"
          content="DevExplained platform for coding and system design"
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="DevExplained - Leetcode Solutions & System Design Guides"
        />
        <meta
          property="twitter:description"
          content="Level up your coding skills with DevExplained’s Leetcode solutions, system design guides, and interview prep."
        />
        <meta
          name="twitter:image"
          content="https://devexplained.vercel.app/twitter-image.jpg"
        />
        <meta
          name="twitter:image:alt"
          content="DevExplained platform for coding and system design"
        />
        <link rel="canonical" href="https://devexplained.vercel.app/" />
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
        <meta name="theme-color" content="#4f46e5" />
        <link rel="preload" href="/og-image.jpg" as="image" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(JSON.stringify(structuredData)),
          }}
        />
      </Head>

      <Toaster position="top-right" toastOptions={{ duration: 4000, className: "mt-4" }} />

      {/* Hero Section */}
      <section className="relative py-20 sm:py-24 bg-gradient-to-br from-indigo-50 to-gray-100 dark:from-slate-900 dark:to-slate-800 overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="h-full w-full bg-[url('/terminal-bg.svg')] bg-cover bg-center" />
        </div>
        <div className="relative max-w-7xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-white mb-6"
          >
            {isLoggedIn ? (
              <>
                Welcome Back, <span className="text-indigo-600 dark:text-indigo-400">{userName}!</span>
              </>
            ) : (
              <>
                Code. Design. <span className="text-indigo-600 dark:text-indigo-400">Succeed.</span>
              </>
            )}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto"
          >
            Master technical interviews with expert Leetcode solutions, system design guides, and personalized learning paths for developers.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link href="/leetcode" prefetch={true}>
              <motion.button
                className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 dark:from-indigo-800 dark:to-indigo-900 text-white rounded-lg text-lg font-semibold hover:bg-indigo-700 dark:hover:bg-indigo-500 transition shadow-lg hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Start solving Leetcode problems"
              >
                Solve Leetcode
              </motion.button>
            </Link>
            <Link href="/system-design" prefetch={true}>
              <motion.button
                className="px-8 py-4 bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 border border-indigo-600 dark:border-indigo-400 rounded-lg text-lg font-semibold hover:bg-indigo-50 dark:hover:bg-slate-600 transition shadow-lg hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Learn system design"
              >
                Master System Design
              </motion.button>
            </Link>
          </motion.div>
          {quickStart && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              className="mt-6 text-gray-600 dark:text-gray-300"
            >
              Quick Start: Try{" "}
              <Link
                href={`/${quickStart.type}/${quickStart.id}`}
                className="text-indigo-600 dark:text-indigo-400 hover:underline"
                prefetch={true}
              >
                {quickStart.title}
              </Link>
            </motion.p>
          )}
        </div>
      </section>

      {/* Progress Section (Logged-In Users Only) */}
      {status === "authenticated" && (
        <section className="py-16 bg-gray-50 dark:bg-slate-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.h2
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12"
            >
              Your Coding Journey
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
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <p className="text-gray-600 dark:text-gray-300 mt-2">Loading progress...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <motion.div
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  className="p-8 bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-700 rounded-3xl shadow-xl"
                >
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Leetcode Progress</h3>
                  <div className="space-y-6">
                    {["solved", "viewed", "tagged"].map((key) => (
                      <div key={key}>
                        <div className="flex justify-between mb-2">
                          <span className="text-gray-600 dark:text-gray-300 font-medium capitalize">{key}</span>
                          <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                            {leetcodeStats[key]}/{key === "solved" ? totalLeetcodeQuestions : leetcodeStats[key]}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-3">
                          <motion.div
                            className="h-3 rounded-full"
                            style={{ backgroundColor: COLORS[key] }}
                            initial={{ width: 0 }}
                            animate={{ width: `${(leetcodeStats[key] / totalLeetcodeQuestions) * 100}%` }}
                            transition={{ duration: 0.7 }}
                          />
                        </div>
                      </div>
                    ))}
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-600 dark:text-gray-300 font-medium">Remaining</span>
                        <span className="font-semibold text-gray-600 dark:text-gray-400">{leetcodeStats.remaining}</span>
                      </div>
                    </div>
                    <div className={`h-${CHART_HEIGHT}`}>
                      <Pie
                        data={leetcodePieData}
                        options={pieOptions}
                        aria-label={`Leetcode progress chart: Solved ${leetcodeStats.solved}, Viewed ${leetcodeStats.viewed}, Tagged ${leetcodeStats.tagged}, Remaining ${leetcodeStats.remaining}`}
                      />
                    </div>
                  </div>
                </motion.div>
                <motion.div
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  className="p-8 bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-700 rounded-3xl shadow-xl"
                >
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">System Design Progress</h3>
                  <div className="space-y-6">
                    {["solved", "viewed", "tagged"].map((key) => (
                      <div key={key}>
                        <div className="flex justify-between mb-2">
                          <span className="text-gray-600 dark:text-gray-300 font-medium capitalize">{key}</span>
                          <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                            {systemDesignStats[key]}/{key === "solved" ? totalSystemDesignQuestions : systemDesignStats[key]}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-3">
                          <motion.div
                            className="h-3 rounded-full"
                            style={{ backgroundColor: COLORS[key] }}
                            initial={{ width: 0 }}
                            animate={{ width: `${(systemDesignStats[key] / totalSystemDesignQuestions) * 100}%` }}
                            transition={{ duration: 0.7 }}
                          />
                        </div>
                      </div>
                    ))}
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-600 dark:text-gray-300 font-medium">Remaining</span>
                        <span className="font-semibold text-gray-600 dark:text-gray-400">{systemDesignStats.remaining}</span>
                      </div>
                    </div>
                    <div className={`h-${CHART_HEIGHT}`}>
                      <Pie
                        data={systemDesignPieData}
                        options={pieOptions}
                        aria-label={`System Design progress chart: Solved ${systemDesignStats.solved}, Viewed ${systemDesignStats.viewed}, Tagged ${systemDesignStats.tagged}, Remaining ${systemDesignStats.remaining}`}
                      />
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-16 bg-white dark:bg-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl sm:text-4xl font-bold text-center text-gray-900 dark:text-white mb-12"
          >
            Tools for Coders to Thrive
          </motion.h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Expert Leetcode Solutions",
                description: "Master algorithms with detailed C++ and Python solutions, including time and space complexity analysis.",
                icon: <CodeBracketIcon className="w-12 h-12 text-indigo-600 dark:text-indigo-400 mb-4" />,
                link: "/leetcode",
              },
              {
                title: "System Design Mastery",
                description: "Learn to design scalable systems like Netflix or Twitter with step-by-step guides.",
                icon: <RocketLaunchIcon className="w-12 h-12 text-indigo-600 dark:text-indigo-400 mb-4" />,
                link: "/system-design",
              },
              {
                title: "Interview Preparation",
                description: "Ace technical interviews with curated problem sets and mock interview resources.",
                icon: <PuzzlePieceIcon className="w-12 h-12 text-indigo-600 dark:text-indigo-400 mb-4" />,
                link: "/interview-prep",
              },
              {
                title: "Community Discussions",
                description: "Join forums to collaborate, share solutions, and learn from other developers.",
                icon: <ChatBubbleLeftRightIcon className="w-12 h-12 text-indigo-600 dark:text-indigo-400 mb-4" />,
                link: "/community",
              },
              {
                title: "Coding Challenges",
                description: "Test your skills with weekly coding challenges and leaderboards.",
                icon: <LightBulbIcon className="w-12 h-12 text-indigo-600 dark:text-indigo-400 mb-4" />,
                link: "/challenges",
              },
              {
                title: "Learning Paths",
                description: "Follow curated paths from beginner to FAANG-level expertise.",
                icon: <BookOpenIcon className="w-12 h-12 text-indigo-600 dark:text-indigo-400 mb-4" />,
                link: "/paths",
              },
            ].map((feature, index) => (
              <Link key={`feature-${index}`} href={feature.link} prefetch={true}>
                <motion.div
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  className="p-6 bg-gray-50 dark:bg-slate-700 rounded-2xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {feature.icon}
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Learning Paths Section */}
      <section className="py-16 bg-gray-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl sm:text-4xl font-bold text-center text-gray-900 dark:text-white mb-12"
          >
            Curated Learning Paths
          </motion.h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Beginner to Intermediate",
                description: "Start with basic algorithms and progress to intermediate data structures.",
                icon: <AcademicCapIcon className="w-8 h-8 text-white" />,
                link: "/paths/beginner",
              },
              {
                title: "Advanced Algorithms",
                description: "Master complex topics like dynamic programming and graph algorithms.",
                icon: <ChartBarIcon className="w-8 h-8 text-white" />,
                link: "/paths/advanced",
              },
              {
                title: "FAANG Interview Prep",
                description: "Prepare for top-tier tech interviews with a comprehensive curriculum.",
                icon: <StarIcon className="w-8 h-8 text-white" />,
                link: "/paths/faang",
              },
            ].map((path, index) => (
              <Link key={`path-${index}`} href={path.link} prefetch={true}>
                <motion.div
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  className="p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-2 border border-indigo-200 dark:border-indigo-800"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 bg-indigo-600 dark:bg-indigo-500 rounded-full flex items-center justify-center" aria-label={`${path.title} learning path icon`}>
                      {path.icon}
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 text-center">{path.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-center break-words">{path.description}</p>
                </motion.div>
              </Link>
            ))}
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-center mt-12"
          >
            <Link href="/paths" prefetch={true}>
              <motion.button
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition shadow-md hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Explore all learning paths"
              >
                Explore All Paths
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-indigo-50 dark:bg-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-12"
          >
            Empowering Coders Worldwide
          </motion.h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8">
            {[
              { label: "Problems Solved", value: 7500 },
              { label: "Design Guides", value: 75 },
              { label: "Code Submissions", value: 25000 },
              { label: "Happy Learners", value: 15000 },
              { label: "Community Members", value: 1000 },
            ].map((stat, index) => (
              <motion.div
                key={`stat-${index}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="p-4"
              >
                <motion.p
                  className="text-4xl font-bold text-indigo-600 dark:text-indigo-400"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1, delay: index * 0.2 }}
                >
                  {stat.value.toLocaleString()}
                </motion.p>
                <p className="text-gray-600 dark:text-gray-300 mt-2">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-12 sm:py-16 bg-gray-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center text-gray-900 dark:text-white mb-8 sm:mb-12"
          >
            Voices from Our Community
          </motion.h2>
          <div className="w-full max-w-3xl lg:max-w-4xl mx-auto overflow-hidden">
            <Carousel
              showThumbs={false}
              autoPlay={true}
              interval={5000}
              infiniteLoop={true}
              showStatus={false}
              dynamicHeight={false}
              emulateTouch={true}
              swipeable={true}
              showArrows={true}
              centerMode={true}
              centerSlidePercentage={100}
              showSlides={1}
              transitionTime={500}
              renderIndicator={(onClick, isSelected, index) => (
                <button
                  className={`w-2 h-2 sm:w-3 sm:h-3 mx-1 rounded-full ${
                    isSelected ? "bg-indigo-600" : "bg-gray-300 dark:bg-gray-500"
                  } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                  onClick={onClick}
                  onKeyDown={(e) => e.key === "Enter" && onClick(e)}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              )}
              renderArrowPrev={(onClick, hasPrev) => (
                hasPrev && (
                  <button
                    className="hidden sm:block absolute left-0 sm:-left-12 top-1/2 -translate-y-1/2 bg-indigo-600 text-white p-2 sm:p-3 rounded-full z-10 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    onClick={onClick}
                    onKeyDown={(e) => e.key === "Enter" && onClick(e)}
                    aria-label="Previous testimonial"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                )
              )}
              renderArrowNext={(onClick, hasNext) => (
                hasNext && (
                  <button
                    className="hidden sm:block absolute right-0 sm:-right-12 top-1/2 -translate-y-1/2 bg-indigo-600 text-white p-2 sm:p-3 rounded-full z-10 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    onClick={onClick}
                    onKeyDown={(e) => e.key === "Enter" && onClick(e)}
                    aria-label="Next testimonial"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )
              )}
              className="w-full"
            >
              {[
                {
                  quote: "DevExplained’s Leetcode solutions helped me land my dream job at a FAANG company!",
                  author: "Jane Doe, Software Engineer",
                },
                {
                  quote: "The system design guides are incredibly detailed and easy to follow.",
                  author: "John Smith, CS Student",
                },
                {
                  quote: "The community forums are a lifesaver for discussing tough problems.",
                  author: "Emily Chen, Developer",
                },
                {
                  quote: "Learning paths gave me a clear roadmap to improve my skills.",
                  author: "Michael Lee, Tech Lead",
                },
                {
                  quote: "The coding challenges keep me sharp and motivated!",
                  author: "Sarah Kim, Software Developer",
                },
                {
                  quote: "DevExplained’s resources made my interview prep seamless.",
                  author: "David Patel, Engineer",
                },
              ].map((testimonial, index) => (
                <motion.div
                  key={`testimonial-${index}`}
                  className="w-full h-auto min-h-[200px] sm:min-h-[250px] flex flex-col items-center justify-center py-6 sm:py-8 px-4 sm:px-6 bg-white dark:bg-slate-800 rounded-xl shadow-md mx-2"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.3 }}
                  aria-label={`Testimonial from ${testimonial.author}`}
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-600 dark:bg-indigo-500 rounded-full flex items-center justify-center mb-4">
                    <UserIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <p className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-300 mb-4 break-words max-w-full text-center">
                    "{testimonial.quote}"
                  </p>
                  <p className="text-sm sm:text-base text-indigo-600 dark:text-indigo-400 font-semibold text-center">
                    {testimonial.author}
                  </p>
                </motion.div>
              ))}
            </Carousel>
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section className="py-16 bg-white dark:bg-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-6"
          >
            Join Our Developer Community
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto"
          >
            Collaborate with thousands of coders, share solutions, and grow your skills in our vibrant forums.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <Link href="/community" prefetch={true}>
              <motion.button
                className="px-8 py-4 bg-indigo-600 text-white rounded-lg text-lg font-semibold hover:bg-indigo-700 transition shadow-lg hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Join the community"
              >
                Join Now
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Resources Section */}
      <section className="py-16 bg-gray-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl sm:text-4xl font-bold text-center text-gray-900 dark:text-white mb-12"
          >
            Explore More Resources
          </motion.h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Coding Tutorials",
                description: "Dive into our blog for in-depth articles on algorithms and data structures.",
                link: "/resources/blog",
              },
              {
                title: "Video Guides",
                description: "Watch video walkthroughs of Leetcode problems and system design solutions.",
                link: "/resources/videos",
              },
              {
                title: "Cheat Sheets",
                description: "Download quick-reference guides for common coding patterns and design principles.",
                link: "/resources/cheatsheets",
              },
            ].map((resource, index) => (
              <Link key={`resource-${index}`} href={resource.link} prefetch={true}>
                <motion.div
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  className="p-6 bg-white dark(bg-slate-800 rounded-2xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{resource.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300">{resource.description}</p>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="py-16 bg-indigo-50 dark:bg-slate-800">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-6"
          >
            Stay Ahead in Coding
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-lg text-gray-600 dark:text-gray-300 mb-8"
          >
            Subscribe for exclusive Leetcode solutions, system design tips, and interview prep updates.
          </motion.p>
          <form
            onSubmit={handleSubscribe}
            className="flex flex-col sm:flex-row gap-4 justify-center"
            noValidate
          >
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-600 bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-64 shadow-sm"
              required
              aria-label="Email for newsletter subscription"
            />
            <motion.button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 dark:from-indigo-800 dark:to-indigo-900 text-white rounded-lg font-semibold hover:bg-indigo-700 dark:hover:bg-indigo-500 transition shadow-md hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Subscribe to newsletter"
            >
              Subscribe
            </motion.button>
          </form>
        </div>
      </section>
    </Layout>
  );
}

export async function getServerSideProps({ req, res }) {
  let session = null;
  let serverError = false;

  try {
    session = await getServerSession(req, res, authOptions);
  } catch (error) {
    console.error("getServerSideProps: Failed to fetch session:", error.message, error.stack);
    serverError = true;
    // Optionally log to an external service (e.g., Sentry)
  }

  return {
    props: {
      initialLoggedIn: !!session,
      initialName: session?.user?.name || "",
      totalLeetcodeQuestions: problems.length,
      totalSystemDesignQuestions: systemDesignQuestions.length,
      serverError,
    },
  };
}