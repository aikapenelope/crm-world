import type { NextConfig } from "next";
import { resolveAllowedDevOrigins } from './src/lib/dev-origins'

const isDevelopment = process.env.NODE_ENV !== 'production'
const allowedDevOrigins = isDevelopment ? resolveAllowedDevOrigins() : []

const nextConfig: NextConfig = {
  distDir: '.mercato/next',
  // TypeScript is validated in CI (yarn typecheck job with NODE_OPTIONS=--max-old-space-size=6144).
  // Skipping it during Docker build to prevent OOM in containers limited to 4 GB heap.
  // The CI typecheck gate ensures no type errors reach production.
  typescript: {
    ignoreBuildErrors: true,
  },
  // Note: ESLint during next build is not configurable via eslint.ignoreDuringBuilds
  // in Next.js 16 (property removed from NextConfig). ESLint runs as a separate CI job.
  experimental: {
    serverMinification: false,
    turbopackMinify: false,
    ...(isDevelopment
      ? {
          preloadEntriesOnStart: false,
        }
      : {}),
  },
  allowedDevOrigins: allowedDevOrigins.length > 0 ? allowedDevOrigins : undefined,
  // Transpile @open-mercato packages that have TypeScript in src/
  // Note: @open-mercato/shared is excluded as it has pre-built dist/ files
  transpilePackages: [
    '@open-mercato/core',
    '@open-mercato/ui',
    '@open-mercato/events',
    '@open-mercato/cache',
    '@open-mercato/queue',
    '@open-mercato/search',
    '@open-mercato/content',
    '@open-mercato/onboarding',
    '@open-mercato/ai-assistant',
  ],
  // Server-external packages: prevent webpack from bundling these.
  // Required for:
  //   - Native addons (.node binaries) that cannot be bundled
  //   - Heavy server-side packages with Node.js stream/buffer internals
  //   - Packages that break when bundled due to dynamic requires
  //
  // Reference: https://nextjs.org/docs/app/api-reference/next-config-js/serverExternalPackages
  serverExternalPackages: [
    // Build tooling — never bundle
    'esbuild',
    '@esbuild/darwin-arm64',
    '@open-mercato/cli',

    // PDF generation — @react-pdf/renderer uses Node.js streams (renderToStream,
    // renderToBuffer) and complex font/image processing that webpack cannot bundle
    // correctly. Must stay external on the server.
    '@react-pdf/renderer',
    '@react-pdf/layout',
    '@react-pdf/primitives',
    '@react-pdf/fns',
    '@react-pdf/font',
    '@react-pdf/image',

    // Native canvas — @napi-rs/canvas ships pre-built .node binaries;
    // webpack cannot bundle native addons.
    '@napi-rs/canvas',

    // New Relic APM — contains native performance bindings
    'newrelic',

    // PDF.js — heavy pdfjs-dist v5 has worker-thread internals that fail when bundled
    'pdfjs-dist',
  ],
  // Mirror server-only env vars that client components must observe. Keep this
  // list minimal — anything added here is inlined into the client bundle.
  env: {
    OM_SEARCH_MIN_LEN: process.env.OM_SEARCH_MIN_LEN,
  },
}

export default nextConfig
