import { useState } from "react";
import { motion } from "framer-motion";
import { EnvelopeIcon, PhoneIcon, CheckCircleIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { toast, Toaster } from "react-hot-toast";
import Layout from "../components/Layout";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }
    if (!formData.message.trim()) newErrors.message = "Message is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to send message");
      }

      toast.custom(
        (t) => (
          <div
            className={`flex items-center gap-3 bg-indigo-600 dark:bg-indigo-500 text-white px-4 py-3 rounded-md shadow-lg max-w-md mx-auto transition-opacity duration-300 ${
              t.visible ? "opacity-100" : "opacity-0"
            }`}
            role="alert"
            aria-live="polite"
          >
            <CheckCircleIcon className="w-6 h-6" />
            <span className="text-base font-medium">
              Message sent successfully!
            </span>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="ml-auto p-1 hover:bg-indigo-700 dark:hover:bg-indigo-600 rounded-full transition-colors duration-200"
              aria-label="Dismiss notification"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        ),
        { duration: 4000 }
      );

      setFormData({ name: "", email: "", message: "" });
      setErrors({});
    } catch (error) {
      console.error("Contact form error:", error.message, error.stack);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  return (
    <Layout
      title="Contact Us - DevExplained"
      description="Get in touch with the DevExplained team for support, feedback, or inquiries."
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white/95 dark:bg-slate-900/95 rounded-2xl shadow-xl p-6 sm:p-8 md:p-10 max-w-5xl mx-auto"
      >
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-6">
          Contact Us
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Send Us a Message
            </h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"
                >
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="block w-full rounded-md border border-gray-300 dark:border-slate-600 bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-gray-100 py-3 px-4 text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
                  aria-invalid={errors.name ? "true" : "false"}
                  aria-describedby={errors.name ? "name-error" : undefined}
                />
                {errors.name && (
                  <p id="name-error" className="mt-1 text-sm text-red-500 dark:text-red-400">
                    {errors.name}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="block w-full rounded-md border border-gray-300 dark:border-slate-600 bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-gray-100 py-3 px-4 text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
                  aria-invalid={errors.email ? "true" : "false"}
                  aria-describedby={errors.email ? "email-error" : undefined}
                />
                {errors.email && (
                  <p id="email-error" className="mt-1 text-sm text-red-500 dark:text-red-400">
                    {errors.email}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"
                >
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={5}
                  className="block w-full rounded-md border border-gray-300 dark:border-slate-600 bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-gray-100 py-3 px-4 text-base shadow-sm min-h-[120px] resize-y focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
                  aria-invalid={errors.message ? "true" : "false"}
                  aria-describedby={errors.message ? "message-error" : undefined}
                />
                {errors.message && (
                  <p id="message-error" className="mt-1 text-sm text-red-500 dark:text-red-400">
                    {errors.message}
                  </p>
                )}
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 bg-indigo-600 text-white rounded-md text-base font-semibold hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Submit contact form"
              >
                {isSubmitting ? "Sending..." : "Send Message"}
              </button>
            </form>
          </div>
          <div className="space-y-6">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Contact Information
            </h2>
            <div className="flex items-center space-x-3">
              <EnvelopeIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              <a
                href="mailto:support@devexplained.com"
                className="text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200"
              >
                support@devexplained.com
              </a>
            </div>
            <div className="flex items-center space-x-3">
              <PhoneIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              <p className="text-gray-700 dark:text-gray-200">
                +1 (555) 123-4567
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Follow Us
              </h3>
              <div className="flex space-x-4">
                <a
                  href="https://github.com/devexplained"
                  className="text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub"
                >
                  GitHub
                </a>
                <a
                  href="https://twitter.com/devexplained"
                  className="text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Twitter"
                >
                  Twitter
                </a>
                <a
                  href="https://linkedin.com/company/devexplained"
                  className="text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                >
                  LinkedIn
                </a>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
      <Toaster position="top-right" toastOptions={{ className: "mt-4" }} />
    </Layout>
  );
}