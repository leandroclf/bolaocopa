/** @type {import('next').NextConfig} */
// GitHub Pages serves a project repo under /<repo>/, so assets need that prefix.
// Set NEXT_PUBLIC_BASE_PATH=/bolaocopa for Pages; leave empty for root hosts
// (Netlify/Vercel drag-and-drop, custom domain at root).
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig = {
  reactStrictMode: true,
  output: "export",               // emits a self-contained ./out
  basePath,
  assetPrefix: basePath || undefined,
  trailingSlash: true,            // route/ -> route/index.html (Pages-friendly)
  images: { unoptimized: true },
  optimizeFonts: false,           // fonts via <link>; no build-time network call
};
export default nextConfig;
