'use client';

export default function LoginButton() {
  return (
    <a
      href="/api/auth/login"
      className="inline-flex items-center gap-2 px-4 md:px-6 py-2.5 md:py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors shadow-sm hover:shadow-md"
    >
      <svg
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>
      <span>连接 SecondMe</span>
    </a>
  );
}
