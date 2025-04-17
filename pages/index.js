import Link from "next/link";
import Head from "next/head";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Layout from "../components/Layout";
import { toast, Toaster } from "react-hot-toast";
import { CodeBracketIcon, ChartBarIcon, UsersIcon, PuzzlePieceIcon, RocketLaunchIcon } from "@heroicons/react/24/solid";
import DOMPurify from "isomorphic-dompurify";
import { useSession } from "next-auth/react";
import { getServerSession } from "next-auth/next";
import authOptions from "./api/auth/[...nextauth]";
import problems from "../data/problems.json";
import systemDesignQuestions from "../data/system_design_questions.json";

export default function Home({
  initialLoggedIn = false,
  initialName = "",
  totalLeetcodeQuestions,
  totalSystemDesignQuestions,
}) {
  const { data: session, status } = useSession();
  const [email, setEmail] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(initialLoggedIn);
  const [userName, setUserName] = useState(initialName);
  const [progress, setProgress] = useState({
    leetcode: { solved: [], tagged: [] },
    systemdesign: { viewed: [], solved: [], tagged: [] },
  });
  const [isLoadingProgress, setIsLoadingProgress] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      setIsLoggedIn(true);
      setUserName(session.user.name || "User");
      fetchProgress();
    } else {
      setIsLoggedIn(false);
      setUserName("");
    }
  }, [status, session]);

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

  // Calculate progress stats
  const leetcodeStats = {
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
    name: "LeetcodeSolve",
    url: "https://devexplained.vercel.app/",
    description: "Master coding interviews with Leetcode solutions and system design guides.",
    publisher: {
      "@type": "Organization",
      name: "LeetcodeSolve Team",
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://devexplained.vercel.app/search?q={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <Layout isLoggedIn={isLoggedIn} userName={userName}>
      <Head>
        <title>LeetcodeSolve - Master Coding & System Design</title>
        <meta
          name="description"
          content="Master coding interviews with LeetcodeSolve's expert Leetcode solutions in C++ and Python, system design guides, and community support."
        />
        <meta
          name="keywords"
          content="Leetcode solutions, system design, coding interviews, algorithms, data structures, C++, Python, coding tutorials, interview prep"
        />
        <meta name="author" content="LeetcodeSolve Team" />
        <meta name="robots" content="index, follow" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta
          property="og:title"
          content="LeetcodeSolve - Master Coding & System Design"
        />
        <meta
          property="og:description"
          content="Prepare for technical interviews with Leetcode solutions, system design tutorials, and coding challenges."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://devexplained.vercel.app/" />
        <meta
          property="og:image"
          content="https://devexplained.vercel.app/og-image.jpg"
        />
        <meta
          property="og:image:alt"
          content="LeetcodeSolve coding and system design platform preview"
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="LeetcodeSolve - Master Coding & System Design"
        />
        <meta
          name="twitter:description"
          content="Level up your coding and system design skills with LeetcodeSolve's expert resources."
        />
        <meta
          name="twitter:image"
          content="https://devexplained.vercel.app/twitter-image.jpg"
        />
        <meta
          name="twitter:image:alt"
          content="LeetcodeSolve coding and system design platform preview"
        />
        <link rel="canonical" href="https://devexplained.vercel.app/" />
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
        <meta name="theme-color" content="#4f46e5" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(JSON.stringify(structuredData)),
          }}
        />
      </Head>

      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />

      {/* Hero Section */}
      <section className="py-16 sm:py-20 bg-gradient-to-b from-gray-50 to-white dark:from-slate-900 dark:to-slate-800">
        <div className="max-w-7xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-800 dark:text-gray-100 mb-6"
          >
            {isLoggedIn ? (
              <>
                Welcome Back, <span className="text-indigo-600 dark:text-indigo-400">{userName}!</span>
              </>
            ) : (
              <>
                Master Coding & <span className="text-indigo-600 dark:text-indigo-400">System Design</span>
              </>
            )}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto"
          >
            Ace technical interviews with expert Leetcode solutions and comprehensive system design guides.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link href="/leetcode" prefetch={false}>
              <motion.button
                className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 dark:from-indigo-800 dark:to-indigo-900 text-white rounded-lg text-lg font-semibold hover:bg-indigo-700 dark:hover:bg-indigo-500 transition shadow-md hover:scale-105 transform focus:outline-none focus:ring-2 focus:ring-indigo-500"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Start solving Leetcode problems"
              >
                Explore Leetcode
              </motion.button>
            </Link>
            <Link href="/system-design" prefetch={false}>
              <motion.button
                className="px-8 py-4 bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 border border-indigo-600 dark:border-indigo-400 rounded-lg text-lg font-semibold hover:bg-indigo-50 dark:hover:bg-slate-600 transition shadow-md hover:scale-105 transform focus:outline-none focus:ring-2 focus:ring-indigo-500"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Learn system design"
              >
                Learn System Design
              </motion.button>
            </Link>
          </motion.div>
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
              className="text-3xl font-bold text-center text-gray-800 dark:text-gray-100 mb-12"
            >
              Your Learning Progress
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
                <motion.div
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  className="p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-lg"
                >
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Leetcode Progress</h3>
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
                  </div>
                </motion.div>
                <motion.div
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  className="p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-lg"
                >
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">System Design Progress</h3>
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
                  </div>
                </motion.div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-16 bg-gray-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-bold text-center text-gray-800 dark:text-gray-100 mb-12"
          >
            Why Choose LeetcodeSolve?
          </motion.h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Detailed Solutions",
                description: "In-depth explanations with code in C++ and Python for every Leetcode problem.",
                icon: <CodeBracketIcon className="w-10 h-10 text-indigo-600 dark:text-indigo-400 mb-4" />,
              },
              {
                title: "System Design Guides",
                description: "Comprehensive tutorials on designing scalable systems like URL shorteners and messaging apps.",
                icon: <RocketLaunchIcon className="w-10 h-10 text-indigo-600 dark:text-indigo-400 mb-4" />,
              },
              {
                title: "Interview Prep",
                description: "Curated resources to master algorithms, data structures, and system design.",
                icon: <PuzzlePieceIcon className="w-10 h-10 text-indigo-600 dark:text-indigo-400 mb-4" />,
              },
              {
                title: "Community Support",
                description: "Join a community of coders to discuss solutions and share insights.",
                icon: <UsersIcon className="w-10 h-10 text-indigo-600 dark:text-indigo-400 mb-4" />,
              },
              {
                title: "Progress Tracking",
                description: "Monitor your coding journey with personalized dashboards and analytics.",
                icon: <ChartBarIcon className="w-10 h-10 text-indigo-600 dark:text-indigo-400 mb-4" />,
              },
            ].map((feature, index) => (
              <motion.div
                key={`feature-${index}`}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                className="p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-1"
              >
                {feature.icon}
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-indigo-50 dark:bg-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-12"
          >
            Our Impact
          </motion.h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
            {[
              { label: "Problems Solved", value: 5000 },
              { label: "Design Guides", value: 50 },
              { label: "Happy Learners", value: 10000 },
              { label: "Community Members", value: 500 },
            ].map((stat, index) => (
              <motion.div
                key={`stat-${index}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="p-4"
              >
                <p className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">
                  {stat.value.toLocaleString()}
                </p>
                <p className="text-gray-600 dark:text-gray-300 mt-2">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-gray-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-bold text-center text-gray-800 dark:text-gray-100 mb-12"
          >
            What Our Users Say
          </motion.h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                quote: "LeetcodeSolve’s clear explanations made complex algorithms so much easier!",
                author: "Jane Doe, Software Engineer",
              },
              {
                quote: "The system design guides were a game-changer for my interviews.",
                author: "John Smith, CS Student",
              },
              {
                quote: "Amazing community support for tackling tough problems!",
                author: "Emily Chen, Developer",
              },
            ].map((testimonial, index) => (
              <motion.div
                key={`testimonial-${index}`}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                className="p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-xl transition"
              >
                <p className="text-gray-600 dark:text-gray-300 mb-4">"{testimonial.quote}"</p>
                <p className="text-indigo-600 dark:text-indigo-400 font-semibold">{testimonial.author}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="py-16 bg-white dark:bg-slate-800">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-4"
          >
            Stay Updated
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-gray-600 dark:text-gray-300 mb-8"
          >
            Subscribe for the latest Leetcode solutions and system design tutorials.
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
              className="px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-64"
              required
              aria-label="Email for newsletter subscription"
            />
            <motion.button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 dark:from-indigo-800 dark:to-indigo-900 text-white rounded-lg font-semibold hover:bg-indigo-700 dark:hover:bg-indigo-500 transition shadow-md hover:scale-105 transform focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
  const session = await getServerSession(req, res, authOptions);

  return {
    props: {
      initialLoggedIn: !!session,
      initialName: session?.user?.name || "",
      totalLeetcodeQuestions: problems.length,
      totalSystemDesignQuestions: systemDesignQuestions.length,
    },
  };
}