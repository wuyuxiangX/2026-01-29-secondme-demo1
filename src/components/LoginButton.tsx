'use client';

import { useState } from 'react';

export default function LoginButton() {
  const [hover, setHover] = useState(false);

  return (
    <a
      href="/api/auth/login"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="group relative inline-flex items-center justify-center overflow-hidden"
    >
      {/* Outer glow */}
      <div
        className={`absolute inset-0 transition-opacity duration-300 ${
          hover ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          boxShadow: '0 0 40px rgba(0, 245, 255, 0.4), 0 0 80px rgba(0, 245, 255, 0.2)',
        }}
      />

      {/* Button container */}
      <div className="relative px-10 py-4 border-2 border-[#00f5ff] bg-[#0a0a0f]/80 backdrop-blur-sm transition-all duration-300 group-hover:bg-[#00f5ff]/10">
        {/* Corner decorations */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#00f5ff] -translate-x-px -translate-y-px" />
        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#00f5ff] translate-x-px -translate-y-px" />
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#00f5ff] -translate-x-px translate-y-px" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#00f5ff] translate-x-px translate-y-px" />

        {/* Content */}
        <div className="flex items-center gap-4">
          {/* Icon */}
          <svg
            className="w-5 h-5 text-[#00f5ff] transition-transform duration-300 group-hover:translate-x-1"
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
          <span
            className="text-[#00f5ff] text-sm font-semibold tracking-[0.2em] uppercase"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            INITIALIZE CONNECTION
          </span>
        </div>

        {/* Scan line effect on hover */}
        <div
          className={`absolute inset-0 bg-gradient-to-b from-transparent via-[#00f5ff]/10 to-transparent transition-transform duration-1000 ${
            hover ? 'translate-y-full' : '-translate-y-full'
          }`}
        />
      </div>

      {/* Status indicator */}
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 text-xs text-[#52525b]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#00f5ff]" />
        <span className="tracking-wider uppercase">READY</span>
      </div>
    </a>
  );
}
