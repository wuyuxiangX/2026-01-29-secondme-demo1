'use client';

import { useState } from 'react';

interface AuthParams {
  clientId: string;
  redirectUri: string;
  scope: string[];
  state: string;
  authorizeUrl: string;
}

export default function LoginButton() {
  const [loading, setLoading] = useState(false);
  const [hover, setHover] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login');
      const authParams: AuthParams = await response.json();

      const form = document.createElement('form');
      form.method = 'POST';
      form.action = authParams.authorizeUrl;

      const addField = (name: string, value: string) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = name;
        input.value = value;
        form.appendChild(input);
      };

      addField('clientId', authParams.clientId);
      addField('redirectUri', authParams.redirectUri);
      addField('state', authParams.state);

      authParams.scope.forEach((s) => {
        addField('scope', s);
      });

      document.body.appendChild(form);
      form.submit();
    } catch (error) {
      console.error('Login error:', error);
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogin}
      disabled={loading}
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
          {loading ? (
            <>
              {/* Loading animation */}
              <div className="relative w-5 h-5">
                <div className="absolute inset-0 border-2 border-[#00f5ff]/30 rounded-full" />
                <div className="absolute inset-0 border-2 border-transparent border-t-[#00f5ff] rounded-full animate-spin" />
              </div>
              <span
                className="text-[#00f5ff] text-sm font-semibold tracking-[0.2em] uppercase"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                CONNECTING...
              </span>
            </>
          ) : (
            <>
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
            </>
          )}
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
        <span className={`w-1.5 h-1.5 rounded-full ${loading ? 'bg-[#ff00ff] animate-pulse' : 'bg-[#00f5ff]'}`} />
        <span className="tracking-wider uppercase">
          {loading ? 'AUTH IN PROGRESS' : 'READY'}
        </span>
      </div>
    </button>
  );
}
