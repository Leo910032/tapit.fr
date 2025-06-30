// File: next.config.js

const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Your existing images configuration
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'linktree.sirv.com',
      },
    ],
  },
  
  // Your existing webpack configuration
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@/components': path.resolve(__dirname, 'app/components'),
      '@/important': path.resolve(__dirname, 'important'),
      '@/forget-password-pages': path.resolve(__dirname, 'app/(forget password pages)'),
      '@/forget-password': path.resolve(__dirname, 'app/forget-password/forgot-password'),
      '@/dashboard': path.resolve(__dirname, 'app/dashboard'),
      '@/elements': path.resolve(__dirname, 'app/elements'),
      '@/hooks': path.resolve(__dirname, 'hooks'),
      '@/LocalHooks': path.resolve(__dirname, 'LocalHooks'),
      '@/lib': path.resolve(__dirname, 'lib'),
      '@/utils': path.resolve(__dirname, 'utils'),
      '@/login': path.resolve(__dirname, 'app/login'),
      '@/signup': path.resolve(__dirname, 'app/signup'),
      '@/styles': path.resolve(__dirname, 'styles'),
      '@/user': path.resolve(__dirname, 'app/[userId]'),
      '@/app': path.resolve(__dirname, 'app')
    };
    return config;
  },

  // ✅ ADDED: Security Headers Configuration
  async headers() {
    return [
      {
        // Apply these headers to all routes in your application.
        source: '/:path*',
        headers: [
          // Prevents Clickjacking
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          // Controls which resources the browser is allowed to load
          {
            key: 'Content-Security-Policy',
            value: `
              default-src 'self' vercel.live;
              script-src 'self' 'unsafe-eval' 'unsafe-inline' cdn.vercel-insights.com vercel.live;
              style-src 'self' 'unsafe-inline';
              img-src 'self' blob: data: firebasestorage.googleapis.com lh3.googleusercontent.com linktree.sirv.com;
              media-src 'none';
              connect-src *;
              font-src 'self';
            `.replace(/\s{2,}/g, ' ').trim(), // This cleans up the multiline string
          },
          // Prevents MIME-sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Controls referrer information
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          // Controls browser feature access
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;