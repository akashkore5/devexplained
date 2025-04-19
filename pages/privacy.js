import { motion } from "framer-motion";
import Layout from "../components/Layout";

export default function Privacy() {
  return (
    <Layout
      title="Privacy Policy - DevExplained"
      description="Learn how DevExplained collects, uses, and protects your personal information in our Privacy Policy."
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white/90 dark:bg-slate-900/90 rounded-2xl shadow-xl p-6 md:p-10 max-w-4xl mx-auto"
      >
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
          Privacy Policy
        </h1>
        <div className="prose dark:prose-invert prose-lg text-gray-700 dark:text-gray-300 space-y-6">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              1. Introduction
            </h2>
            <p>
              At DevExplained, we value your privacy. This Privacy Policy explains
              how we collect, use, and protect your personal information when you
              use our Service.
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              2. Information We Collect
            </h2>
            <p>We may collect the following types of information:</p>
            <ul>
              <li>
                <strong>Personal Information:</strong> Name, email address, and
                other details provided during account creation or contact forms.
              </li>
              <li>
                <strong>Usage Data:</strong> Information about how you interact with
                the Service, such as pages visited and features used.
              </li>
              <li>
                <strong>Cookies:</strong> Small data files stored on your device to
                enhance your experience (e.g., remembering your theme preference).
              </li>
            </ul>
          </section>
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              3. How We Use Your Information
            </h2>
            <p>Your information is used to:</p>
            <ul>
              <li>Provide and improve the Service.</li>
              <li>Personalize your experience (e.g., tailored content).</li>
              <li>
                Communicate with you, including responding to inquiries and sending
                updates.
              </li>
              <li>Analyze usage to enhance performance and security.</li>
            </ul>
          </section>
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              4. Sharing Your Information
            </h2>
            <p>
              We do not sell your personal information. We may share it with:
            </p>
            <ul>
              <li>
                Service providers (e.g., hosting, analytics) under strict
                confidentiality agreements.
              </li>
              <li>
                Legal authorities, if required by law or to protect our rights.
              </li>
            </ul>
          </section>
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              5. Data Security
            </h2>
            <p>
              We implement reasonable security measures to protect your data, such
              as encryption and access controls. However, no system is completely
              secure, and we cannot guarantee absolute security.
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              6. Your Rights
            </h2>
            <p>
              Depending on your location, you may have rights to:
            </p>
            <ul>
              <li>Access, correct, or delete your personal information.</li>
              <li>Opt out of certain data collection (e.g., cookies).</li>
              <li>Request data portability.</li>
            </ul>
            <p>
              Contact us at{" "}
              <a
                href="mailto:akashkore5@gmail.com"
                className="text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                akashkore5@gmail.com
              </a>{" "}
              to exercise these rights.
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              7. Cookies
            </h2>
            <p>
              We use cookies to enhance your experience. You can manage cookie
              preferences through your browser settings.
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              8. Changes to This Policy
            </h2>
            <p>
              We may update this Privacy Policy. Changes will be posted here, and
              significant updates may be communicated via email.
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              9. Contact Us
            </h2>
            <p>
              For privacy-related questions, contact us at{" "}
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