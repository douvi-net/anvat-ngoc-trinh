declare module "next-pwa";
declare module "next-pwa/cache" {
  import type { RuntimeCaching } from "workbox-build";
  const runtimeCaching: RuntimeCaching[];
  export default runtimeCaching;
}
