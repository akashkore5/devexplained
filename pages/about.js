import { motion } from "framer-motion";
import { CodeBracketIcon, RocketLaunchIcon, UserGroupIcon } from "@heroicons/react/24/solid";
import Layout from "../components/Layout";

export default function About() {
  return (
    <Layout
      title="About Us - DevExplained"
      description="Learn about DevExplained, our mission to empower coders, and the team behind our coding and system design resources."
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white/90 dark:bg-slate-900/90 rounded-2xl shadow-xl p-6 md:p-10 max-w-4xl mx-auto"
      >
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
          About DevExplained
        </h1>
        <div className="prose dark:prose-invert prose-lg text-gray-700 dark:text-gray-300 space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
              <CodeBracketIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              <span>Our Mission</span>
            </h2>
            <p>
              At DevExplained, we’re dedicated to empowering coders to ace
              technical interviews and master software engineering. Our expertly
              crafted Leetcode solutions, system design guides, and programming
              challenges provide the tools you need to succeed.
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
              <RocketLaunchIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              <span>What We Offer</span>
            </h2>
            <ul>
              <li>
                <strong>Leetcode Solutions:</strong> Step-by-step explanations and
                optimized code for hundreds of problems.
              </li>
              <li>
                <strong>System Design Guides:</strong> In-depth resources for
                designing scalable systems, from basics to advanced.
              </li>
              <li>
                <strong>Community Support:</strong> Engage with fellow coders
                through our forums and social channels.
              </li>
            </ul>
          </section>
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
              <UserGroupIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              <span>Our Team</span>
            </h2>
            <p>
              We’re a team of passionate software engineers, educators, and
              interview prep experts. With years of experience at top tech
              companies, we’ve built DevExplained to share our knowledge and help
              you achieve your career goals.
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Get in Touch
            </h2>
            <p>
              Have questions or want to collaborate? Reach out to us at{" "}
              <a
                href="mailto:akashkore5@gmail.com"
                className="text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                akashkore5@gmail.com
              </a>{" "}
              or follow us on{" "}
              <a
                href="https://twitter.com/devexplained"
                className="text-indigo-600 dark:text-indigo-400 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Twitter
              </a>
              .
            </p>
          </section>
        </div>
      </motion.div>
    </Layout>
  );
}