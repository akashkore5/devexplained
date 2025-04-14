import Link from "next/link";
import { motion } from "framer-motion";
import Layout from "../components/Layout";

export default function Home() {
  // Animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <Layout>
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
            <Link href="/leetcode">
              <button className="px-6 py-3 sm:px-8 sm:py-4 bg-indigo-600 text-white rounded-full text-base sm:text-lg font-semibold hover:bg-indigo-700 dark:hover:bg-indigo-500 transition shadow-md hover:scale-105 transform focus:outline-none focus:ring-2 focus:ring-indigo-500">
                Start Solving Now
              </button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 bg-gray-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-800 dark:text-gray-100 mb-8 sm:mb-12">Why Choose LeetcodeSolve?</h2>
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
            ].map((feature, index) => (
              <motion.div
                key={index}
                variants={cardVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-md hover:shadow-lg transition transform hover:-translate-y-1"
              >
                <svg className="w-8 h-8 sm:w-10 sm:h-10 text-indigo-600 dark:text-indigo-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={feature.icon} />
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            {[
              { label: "Problems Solved", value: 5000 },
              { label: "Languages Supported", value: 2 },
              { label: "Happy Learners", value: 10000 },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className="p-4"
              >
                <p className="text-3xl sm:text-4xl font-bold text-indigo-600 dark:text-indigo-400">{stat.value.toLocaleString()}</p>
                <p className="text-gray-600 dark:text-gray-300 mt-2 text-sm sm:text-base">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-12 sm:py-16 bg-gray-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-800 dark:text-gray-100 mb-8 sm:mb-12">What Our Users Say</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
            {[
              {
                quote: "LeetcodeSolve helped me understand complex algorithms with clear explanations!",
                author: "Jane Doe, Software Engineer",
              },
              {
                quote: "The multi-language solutions saved me hours during interview prep.",
                author: "John Smith, CS Student",
              },
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                variants={cardVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-md"
              >
                <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm sm:text-base">"{testimonial.quote}"</p>
                <p className="text-indigo-600 dark:text-indigo-400 font-semibold text-sm sm:text-base">{testimonial.author}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="py-12 sm:py-16 bg-white dark:bg-slate-800">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-4">Stay Updated</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6 sm:mb-8 text-sm sm:text-base">Subscribe to get the latest tutorials and solutions.</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              alert("Thank you for subscribing! (This is a demo.)");
            }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <input
              type="email"
              placeholder="Enter your email"
              className="px-4 py-2 rounded-full border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-64 text-sm sm:text-base"
              required
            />
            <button
              type="submit"
              className="px-6 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 dark:hover:bg-indigo-500 transition hover:scale-105 transform focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </Layout>
  );
}