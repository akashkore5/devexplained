// pages/auth/error.js
import { useRouter } from 'next/router';

export default function AuthError() {
  const router = useRouter();
  const { error } = router.query;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-slate-900">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">Authentication Error</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          {error ? decodeURIComponent(error) : 'An unknown error occurred.'}
        </p>
        <button
          onClick={() => router.push('/')}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}