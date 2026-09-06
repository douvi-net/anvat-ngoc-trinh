import withPWA from "next-pwa";
import defaultRuntimeCaching from "next-pwa/cache";

const nextConfig = {
  reactStrictMode: true,
};

export default withPWA({
  dest: "public",
  runtimeCaching: [
    {
      // Availability must never fall back to an old PWA API response.
      urlPattern: ({ url }: { url: URL }) =>
        url.origin === self.location.origin && url.pathname === "/api/branch-toppings",
      handler: "NetworkOnly",
      method: "GET",
    },
    ...defaultRuntimeCaching,
  ],
  disable: process.env.NODE_ENV === "development",
})(nextConfig);
