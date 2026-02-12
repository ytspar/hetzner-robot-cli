import { defineConfig, type Plugin } from "vite";

const PROD_ORIGIN = "https://ytspar.github.io";

/**
 * Rewrite relative og:image / twitter:image URLs to absolute during production
 * builds. Social media crawlers require absolute URLs for unfurl previews.
 */
function ogAbsoluteUrls(): Plugin {
  let base = "/";
  return {
    name: "og-absolute-urls",
    configResolved(config) {
      base = config.base;
    },
    transformIndexHtml(html) {
      if (process.env.NODE_ENV !== "production") return html;
      return html.replace(
        /(<meta\s+(?:property|name)="(?:og|twitter):image"\s+content=")([^"]+)(")/g,
        (_: string, before: string, url: string, after: string) => {
          if (url.startsWith("http")) return before + url + after;
          return before + PROD_ORIGIN + base + url + after;
        },
      );
    },
  };
}

export default defineConfig({
  plugins: [ogAbsoluteUrls()],
  root: ".",
  base: "/hetzner-cli/",
  build: {
    outDir: "dist",
  },
});
