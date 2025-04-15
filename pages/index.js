import Link from "next/link";
import { motion } from "framer-motion";
import Layout from "../components/Layout";
import Head from "next/head";
import { useState } from "react";
import { toast, Toaster } from "react-hot-toast";

export default function Home() {
  const [email, setEmail] = useState("");
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "LeetcodeSolve",
    url: "https://devexplained.vercel.app/",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://devexplained.vercel.app/search?q={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  };

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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success(data.message);
        setEmail("");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again!");
    }
  };

  return (
    <Layout>
      <Head>
        <title>LeetcodeSolve - Master Coding with Expert Leetcode Solutions</title>
        <meta
          name="description"
          content="Master coding interviews with LeetcodeSolve's detailed Leetcode solutions in C++ and Python, expert tutorials, and community support."
        />
        <meta
          name="keywords"
          content="Leetcode solutions, coding interviews, algorithms, data structures, C++, Python, coding tutorials"
        />
        <meta name="author" content="LeetcodeSolve Team" />
        <meta name="robots" content="index, follow" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta property="og:title" content="LeetcodeSolve - Master Coding with Expert Leetcode Solutions" />
        <meta
          property="og:description"
          content="Explore detailed Leetcode solutions, tutorials, and interview prep resources to excel in coding interviews."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://devexplained.vercel.app/" />
        <meta property="og:image" content="https://devexplained.vercel.app/og-image.jpg" />
        <meta property="og:image:alt" content="LeetcodeSolve coding platform preview" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="LeetcodeSolve - Master Coding with Expert Leetcode Solutions" />
        <meta
          name="twitter:description"
          content="Level up your coding skills with LeetcodeSolve's expert solutions and tutorials."
        />
        <meta name="twitter:image" content="https://devexplained.vercel.app/twitter-image.jpg" />
        <meta name="twitter:image:alt" content="LeetcodeSolve coding platform preview" />
        <link rel="canonical" href="https://devexplained.vercel.app/" />
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="theme-color" content="#4f46e5" />
        <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
        <meta name="google-site-verification" content="your-google-verification-code" />
        <meta name="bing-site-verification" content="your-bing-verification-code" />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Head>

      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />

      {/* Hero Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-b from-gray-50 to-white dark:from-slate-900 dark:to-slate-800">
        <div className="max-w-7xl mx-auto text-center px-4 sm:px-6">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-800 dark:text-gray-100 mb-4 sm:mb-6"
          >
            Master Coding with <span className="text-indigo-600 dark:text-indigo-400">LeetcodeSolve</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-6 sm:mb-8 max-w-3xl mx-auto"
          >
            Explore detailed Leetcode solutions, ace coding interviews, and level up with tutorials in C++ and Python.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <Link href="/leetcode" prefetch={false}>
              <button
                className="px-6 py-3 sm:px-8 sm:py-4 bg-indigo-600 text-white rounded-full text-base sm:text-lg font-semibold hover:bg-indigo-700 dark:hover:bg-indigo-500 transition shadow-md hover:scale-105 transform focus:outline-none focus:ring-2 focus:ring-indigo-500"
                aria-label="Start solving Leetcode problems"
              >
                Start Solving Now
              </button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 bg-gray-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-800 dark:text-gray-100 mb-8 sm:mb-12">
            Why Choose LeetcodeSolve?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                title: "Detailed Solutions",
                description: "In-depth explanations with code in C++ and Python for every Leetcode problem.",
                icon: "M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z",
              },
              {
                title: "Interview Prep",
                description: "Curated resources to master algorithms, data structures, and system design.",
                icon: "M19 14v3h-7v-7h7v4zm0-9v4h-7V5h7zM5 5v12h7v-7H5v-5zm14 0h2v12h-2zM3 5H1v12h2z",
              },
              {
                title: "Community Support",
                description: "Join a community of coders to discuss solutions and share insights.",
                icon: "M18 13c0 3.31-2.69 6-6 6s-6-2.69-6-6 2.69-6 6-6v4l5-5-5-5v4c-4.42 0-8 3.58-8 8s3.58 8 8 8 8-3.58 8-8h-2z",
              },
              {
                title: "Progress Tracking",
                description: "Monitor your coding journey with personalized dashboards and analytics.",
                icon: "M21 6H3v2h18V6zm0 5H3v2h18v-2zm0 5H3v2h18v-2z",
              },
            ].map((feature, index) => (
              <motion.div
                key={`feature-${index}`}
                variants={cardVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-md hover:shadow-lg transition transform hover:-translate-y-1"
              >
                <svg
                  className="w-8 h-8 sm:w-10 sm:h-10 text-indigo-600 dark:text-indigo-400 mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={feature.icon}
                  />
                </svg>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 sm:py-16 bg-indigo-50 dark:bg-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-8 sm:mb-12">Our Impact</h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 sm:gap-8">
            {[
              { label: "Problems Solved", value: 5000 },
              { label: "Languages Supported", value: 3 },
              { label: "Happy Learners", value: 10000 },
              { label: "Community Members", value: 500 },
            ].map((stat, index) => (
              <motion.div
                key={`stat-${index}`}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className="p-4"
              >
                <p className="text-3xl sm:text-4xl font-bold text-indigo-600 dark:text-indigo-400">
                  {stat.value.toLocaleString()}
                </p>
                <p className="text-gray-600 dark:text-gray-300 mt-2 text-sm sm:text-base">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-12 sm:py-16 bg-gray-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-800 dark:text-gray-100 mb-8 sm:mb-12">
            What Our Users Say
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                quote: "LeetcodeSolve helped me understand complex algorithms with clear explanations!",
                author: "Jane Doe, Software Engineer",
              },
              {
                quote: "The multi-language solutions saved me hours during interview prep.",
                author: "John Smith, CS Student",
              },
              {
                quote: "The community support is amazing for tackling tough problems!",
                author: "Emily Chen, Developer",
              },
            ].map((testimonial, index) => (
              <motion.div
                key={`testimonial-${index}`}
                variants={cardVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-md"
              >
                <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm sm:text-base">"{testimonial.quote}"</p>
                <p className="text-indigo-600 dark:text-indigo-400 font-semibold text-sm sm:text-base">
                  {testimonial.author}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="py-12 sm:py-16 bg-white dark:bg-slate-800">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-4">Stay Updated</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6 sm:mb-8 text-sm sm:text-base">
            Subscribe to get the latest tutorials and solutions.
          </p>
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
              className="px-4 py-2 rounded-full border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-64 text-sm sm:text-base"
              required
              aria-label="Email for newsletter subscription"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 dark:hover:bg-indigo-500 transition hover:scale-105 transform focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label="Subscribe to newsletter"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </Layout>
  );
}