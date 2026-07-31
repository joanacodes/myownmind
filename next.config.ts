import type { NextConfig } from "next";

const config: NextConfig = {
  images: {
    // We hotlink source images rather than re-hosting them, so any host is fair game.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default config;
