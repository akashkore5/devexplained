import { motion } from "framer-motion";
import Layout from "../components/Layout";

export default function Terms() {
  return (
    <Layout
      title="Terms of Service - DevExplained"
      description="Read the Terms of Service for DevExplained, outlining user responsibilities, acceptable use, and legal disclaimers."
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white/90 dark:bg-slate-900/90 rounded-2xl shadow-xl p-6 md:p-10 max-w-4xl mx-auto"
      >
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
          Terms of Service
        </h1>
        <div className="prose dark:prose-invert prose-lg text-gray-700 dark:text-gray-300 space-y-6">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing or using DevExplained ("the Service"), you agree to be
              bound by these Terms of Service ("Terms"). If you do not agree, please
              do not use the Service.
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              2. Use of the Service
            </h2>
            <p>
              You agree to use the Service only for lawful purposes and in a manner
              consistent with its intended purpose. You may not:
            </p>
            <ul>
              <li>
                Use the Service to violate any applicable laws or regulations.
              </li>
              <li>
                Copy, distribute, or modify any content without permission.
              </li>
              <li>
                Engage in any activity that disrupts or harms the Service.
              </li>
            </ul>
          </section>
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              3. User Accounts
            </h2>
            <p>
              To access certain features, you may need to create an account. You are
              responsible for maintaining the confidentiality of your account
              credentials and for all activities under your account.
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              4. Intellectual Property
            </h2>
            <p>
              All content on the Service, including text, code, and designs, is
              owned by DevExplained or its licensors. You may not reproduce or
              distribute this content without prior written consent.
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              5. Limitation of Liability
            </h2>
            <p>
              The Service is provided "as is" without warranties of any kind.
              DevExplained is not liable for any damages arising from your use of
              the Service, including loss of data or profits.
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              6. Termination
            </h2>
            <p>
              We may suspend or terminate your access to the Service at our
              discretion, with or without notice, for violations of these Terms.
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              7. Changes to Terms
            </h2>
            <p>
              We may update these Terms at any time. Continued use of the Service
              after changes constitutes acceptance of the new Terms.
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              8. Contact Us
            </h2>
            <p>
              For questions about these Terms, please contact us at{" "}
              <a
                href="mailto:akashkore5@gmail.com"
                className="text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                akashkore5@gmail.com
              </a>
              .
            </p>
          </section>
        </div>
      </motion.div>
    </Layout>
  );
}