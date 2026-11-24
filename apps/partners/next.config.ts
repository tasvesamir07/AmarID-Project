import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Addresses from the first version of the demos, kept so old links and open tabs still land somewhere.
  async redirects() {
    return [
      { source: "/bazar", destination: "/daraz", permanent: false },
      { source: "/bazar/:path*", destination: "/daraz", permanent: false },
      { source: "/bank", destination: "/bkash", permanent: false },
      { source: "/bank/:path*", destination: "/bkash", permanent: false },
    ];
  },
  async headers() {
    return [{ source: "/:path*", headers: [{ key: "Referrer-Policy", value: "no-referrer" }, { key: "X-Content-Type-Options", value: "nosniff" }, { key: "X-Frame-Options", value: "DENY" }] }];
  },
};

export default config;
