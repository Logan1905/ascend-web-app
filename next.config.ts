import type { NextConfig } from "next";

// GitHub Pages serves the site from /<repo-name>, but local dev serves from /.
const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  output: "export",
  basePath: isProd ? "/ascend-web-app" : "",
  devIndicators: false,
};

export default nextConfig;
