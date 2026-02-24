import { Glob } from "bun";
import { mkdir, cp, readFile, writeFile, exists } from "node:fs/promises";
import { join, dirname, basename, relative } from "node:path";
import { Marked } from "marked";
import { createHighlighter } from "shiki";

// ===== Configuration =====

const ROOT = import.meta.dir;
const DIST = join(ROOT, "dist");
const STYLES_SRC = join(ROOT, "styles", "main.css");
const STYLES_DEST = join(DIST, "styles");

interface NavItem {
  title: string;
  href: string;
  file: string;
}

interface NavSection {
  name: string;
  dir: string;
  items: NavItem[];
}

// Navigation structure — order matters for sidebar display
const NAV_SECTIONS: NavSection[] = [
  {
    name: "Vue Ecosystem",
    dir: "vue-ecosystem",
    items: [
      { title: "Overview", href: "/vue-ecosystem/overview.html", file: "vue-ecosystem/overview.md" },
      { title: "Test Organization", href: "/vue-ecosystem/test-organization.html", file: "vue-ecosystem/test-organization.md" },
      { title: "No Import Mocks", href: "/vue-ecosystem/no-import-mocks.html", file: "vue-ecosystem/no-import-mocks.md" },
      { title: "Architectural DI", href: "/vue-ecosystem/architectural-di.html", file: "vue-ecosystem/architectural-di.md" },
      { title: "Mocking Patterns", href: "/vue-ecosystem/mocking-patterns.html", file: "vue-ecosystem/mocking-patterns.md" },
      { title: "Test Utilities", href: "/vue-ecosystem/test-utilities.html", file: "vue-ecosystem/test-utilities.md" },
      { title: "Testing by Subsystem", href: "/vue-ecosystem/testing-by-subsystem.html", file: "vue-ecosystem/testing-by-subsystem.md" },
      { title: "E2E & Integration", href: "/vue-ecosystem/e2e-and-integration.html", file: "vue-ecosystem/e2e-and-integration.md" },
      { title: "Per-Project Breakdown", href: "/vue-ecosystem/per-project-breakdown.html", file: "vue-ecosystem/per-project-breakdown.md" },
    ],
  },
  {
    name: "TanStack",
    dir: "tanstack",
    items: [
      { title: "Overview", href: "/tanstack/overview.html", file: "tanstack/overview.md" },
      { title: "Test Organization", href: "/tanstack/test-organization.html", file: "tanstack/test-organization.md" },
      { title: "Core/Adapter Split", href: "/tanstack/core-adapter-split.html", file: "tanstack/core-adapter-split.md" },
      { title: "Mocking Patterns", href: "/tanstack/mocking-patterns.html", file: "tanstack/mocking-patterns.md" },
      { title: "Dependency Injection", href: "/tanstack/dependency-injection.html", file: "tanstack/dependency-injection.md" },
      { title: "Test Utilities", href: "/tanstack/test-utilities.html", file: "tanstack/test-utilities.md" },
      { title: "Async Testing", href: "/tanstack/async-testing.html", file: "tanstack/async-testing.md" },
      { title: "Type Testing", href: "/tanstack/type-testing.html", file: "tanstack/type-testing.md" },
      { title: "Per-Project Breakdown", href: "/tanstack/per-project-breakdown.html", file: "tanstack/per-project-breakdown.md" },
    ],
  },
  {
    name: "Vercel",
    dir: "vercel",
    items: [
      { title: "Overview", href: "/vercel/overview.html", file: "vercel/overview.md" },
      { title: "Test Organization", href: "/vercel/test-organization.html", file: "vercel/test-organization.md" },
      { title: "Mocking Patterns", href: "/vercel/mocking-patterns.html", file: "vercel/mocking-patterns.md" },
      { title: "Test Harnesses", href: "/vercel/test-harnesses.html", file: "vercel/test-harnesses.md" },
      { title: "Test Utilities", href: "/vercel/test-utilities.html", file: "vercel/test-utilities.md" },
      { title: "E2E & Integration", href: "/vercel/e2e-and-integration.html", file: "vercel/e2e-and-integration.md" },
      { title: "Rust Testing", href: "/vercel/rust-testing.html", file: "vercel/rust-testing.md" },
      { title: "Per-Project Breakdown", href: "/vercel/per-project-breakdown.html", file: "vercel/per-project-breakdown.md" },
    ],
  },
  {
    name: "Fastify",
    dir: "fastify",
    items: [
      { title: "Overview", href: "/fastify/overview.html", file: "fastify/overview.md" },
      { title: "Test Organization", href: "/fastify/test-organization.html", file: "fastify/test-organization.md" },
      { title: "The Inject Pattern", href: "/fastify/inject-pattern.html", file: "fastify/inject-pattern.md" },
      { title: "Plugin Testing", href: "/fastify/plugin-testing.html", file: "fastify/plugin-testing.md" },
      { title: "Mocking Patterns", href: "/fastify/mocking-patterns.html", file: "fastify/mocking-patterns.md" },
      { title: "Test Utilities", href: "/fastify/test-utilities.html", file: "fastify/test-utilities.md" },
      { title: "Per-Project Breakdown", href: "/fastify/per-project-breakdown.html", file: "fastify/per-project-breakdown.md" },
    ],
  },
  {
    name: "Svelte",
    dir: "svelte",
    items: [
      { title: "Overview", href: "/svelte/overview.html", file: "svelte/overview.md" },
      { title: "Test Organization", href: "/svelte/test-organization.html", file: "svelte/test-organization.md" },
      { title: "Compiler Testing", href: "/svelte/compiler-testing.html", file: "svelte/compiler-testing.md" },
      { title: "Runtime Testing", href: "/svelte/runtime-testing.html", file: "svelte/runtime-testing.md" },
      { title: "SvelteKit Testing", href: "/svelte/sveltekit-testing.html", file: "svelte/sveltekit-testing.md" },
      { title: "Test Utilities", href: "/svelte/test-utilities.html", file: "svelte/test-utilities.md" },
      { title: "Per-Project Breakdown", href: "/svelte/per-project-breakdown.html", file: "svelte/per-project-breakdown.md" },
    ],
  },
];

// Build a lookup: relative md path → output html path
function mdToHtmlPath(mdRelPath: string): string {
  const name = basename(mdRelPath, ".md");
  const dir = dirname(mdRelPath);
  const htmlName = name === "README" ? "index.html" : `${name}.html`;
  return dir === "." ? htmlName : join(dir, htmlName);
}

// ===== Shiki + Marked Setup =====

async function createMarkedInstance() {
  const highlighter = await createHighlighter({
    themes: ["github-dark", "github-light"],
    langs: [
      "typescript", "javascript", "tsx", "jsx", "json", "bash", "shell",
      "html", "css", "vue", "yaml", "markdown", "diff", "rust", "toml",
    ],
  });

  const marked = new Marked();

  marked.use({
    renderer: {
      code({ text, lang }) {
        const language = lang || "text";

        // Detect file tree blocks: no lang tag + contains path-like lines
        const isFileTree =
          !lang &&
          (text.includes("├──") ||
            text.includes("└──") ||
            /^\s*[\w.-]+\/\s*$/m.test(text));

        if (isFileTree) {
          const escaped = text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");

          const highlighted = escaped
            .split("\n")
            .map((line) => {
              // Split line into: leading whitespace/tree chars, content, optional comment
              const commentMatch = line.match(/^(.*?)(#\s*.+)$/);
              let mainPart = commentMatch ? commentMatch[1] : line;
              const comment = commentMatch ? commentMatch[2] : "";

              // Highlight tree-drawing characters (├── └── │ ─)
              mainPart = mainPart.replace(
                /([│├└─┬┤┼]+(?:──)?)/g,
                '<span class="ft-branch">$1</span>'
              );

              // Highlight directory names: "word/" but process whole token
              // A token ending with / is a directory
              mainPart = mainPart.replace(
                /(?<![.\w])([A-Za-z0-9_][\w.*-]*\/)/g,
                '<span class="ft-dir">$1</span>'
              );

              // Highlight filenames: tokens with a dot that aren't directories
              // Match whole filenames like "reactive.spec.ts" as one unit
              mainPart = mainPart.replace(
                /(?<![.\w\/])([A-Za-z0-9_][\w-]*(?:\.[\w]+)+)(?=\s|$)/g,
                (_match, filename) => {
                  const ext = filename.split(".").pop() || "";
                  return `<span class="ft-file ft-ext-${ext}">${filename}</span>`;
                }
              );

              // Highlight "..." or "60+ more" style text
              mainPart = mainPart.replace(
                /(\.\.\.\s*\d*\+?\s*\w*)/g,
                '<span class="ft-comment">$1</span>'
              );

              const commentHtml = comment
                ? `<span class="ft-comment">${comment}</span>`
                : "";

              return mainPart + commentHtml;
            })
            .join("\n");

          return `<div class="code-block file-tree"><div class="code-chrome"><span class="code-dots"><span></span><span></span><span></span></span><span class="code-lang">FILES</span></div><pre class="shiki"><code>${highlighted}</code></pre></div>`;
        }

        const langLabel = language.toUpperCase();

        // Extract filename from first-line comment like "// path/to/file.ts"
        let codeText = text;
        let filename = "";
        const filenameMatch = codeText.match(/^\/\/\s*([\w./_-]+\.\w+)\s*\n/);
        if (filenameMatch) {
          filename = filenameMatch[1];
          codeText = codeText.slice(filenameMatch[0].length);
        }

        // Chrome: filepath breadcrumb or language label
        let chromeLabel: string;
        if (filename) {
          const parts = filename.split("/");
          const file = parts.pop() || "";
          const dirs = parts.map((d) => `${d}<span class="fp-sep">/</span>`).join("");
          chromeLabel = `<span class="code-filepath">${dirs}<span class="fp-file">${file}</span></span>`;
        } else {
          chromeLabel = `<span class="code-lang">${langLabel}</span>`;
        }

        let codeHtml: string;
        try {
          codeHtml = highlighter.codeToHtml(codeText, {
            lang: language,
            themes: { dark: "github-dark", light: "github-light" },
          });
        } catch {
          const escaped = codeText
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
          codeHtml = `<pre class="shiki"><code>${escaped}</code></pre>`;
        }
        return `<div class="code-block${filename ? " has-filename" : ""}"><div class="code-chrome"><span class="code-dots"><span></span><span></span><span></span></span>${chromeLabel}</div>${codeHtml}</div>`;
      },
      // Convert .md links to .html links
      link({ href, title, text }) {
        if (href && href.endsWith(".md")) {
          href = href.replace(/\.md$/, ".html").replace(/README\.html$/, "index.html");
        }
        if (href && href.endsWith("/README.html")) {
          href = href.replace(/README\.html$/, "index.html");
        }
        const titleAttr = title ? ` title="${title}"` : "";
        return `<a href="${href}"${titleAttr}>${text}</a>`;
      },
      heading({ text, depth }) {
        const id = text
          .toLowerCase()
          .replace(/<[^>]*>/g, "")
          .replace(/[^\w\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-")
          .trim();
        return `<h${depth} id="${id}">${text}</h${depth}>`;
      },
    },
  });

  return marked;
}

// ===== HTML Template =====

function renderSidebar(currentHref: string, rootPrefix: string): string {
  return NAV_SECTIONS.map((section) => {
    const isActive = currentHref.startsWith(`/${section.dir}/`);
    return `
      <div class="sidebar-section${isActive ? " open" : ""}">
        <button class="sidebar-heading" aria-expanded="${isActive}">${section.name}</button>
        <ul class="sidebar-links">
          ${section.items
            .map(
              (item) => {
                const relHref = rootPrefix + item.href.slice(1); // strip leading /
                return `<li><a href="${relHref}"${item.href === currentHref ? ' class="active"' : ""}>${item.title}</a></li>`;
              }
            )
            .join("\n          ")}
        </ul>
      </div>`;
  }).join("\n");
}

function htmlTemplate(title: string, content: string, currentHref: string): string {
  // Calculate relative path to root for CSS
  const depth = currentHref.split("/").filter(Boolean).length - 1;
  const rootPrefix = depth > 0 ? "../".repeat(depth) : "./";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — How They Test</title>
  <link rel="stylesheet" href="${rootPrefix}styles/main.css">
</head>
<body>
  <a href="#main-content" class="skip-link">Skip to content</a>

  <header class="site-header">
    <button class="menu-toggle" aria-label="Toggle navigation">☰</button>
    <a href="${rootPrefix}index.html">How They Test</a>
  </header>

  <div class="site-layout">
    <nav class="sidebar" aria-label="Documentation">
      ${renderSidebar(currentHref, rootPrefix)}
    </nav>
    <div class="sidebar-overlay"></div>

    <main class="main-content" id="main-content">
      <article class="content-article">
        ${content}
      </article>
    </main>
  </div>

  <script>
    // Sidebar toggle (mobile)
    const toggle = document.querySelector('.menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');

    toggle?.addEventListener('click', () => {
      sidebar?.classList.toggle('open');
      overlay?.classList.toggle('open');
    });

    overlay?.addEventListener('click', () => {
      sidebar?.classList.remove('open');
      overlay?.classList.remove('open');
    });

    // Collapsible sections
    document.querySelectorAll('.sidebar-heading').forEach(btn => {
      btn.addEventListener('click', () => {
        const section = btn.parentElement;
        const isOpen = section.classList.toggle('open');
        btn.setAttribute('aria-expanded', isOpen);
      });
    });
  </script>
</body>
</html>`;
}

// ===== Landing Page Template =====

function landingTemplate(rootPrefix: string): string {
  const ecosystems = [
    {
      name: "Vue Ecosystem",
      href: `${rootPrefix}vue-ecosystem/overview.html`,
      description: "Vue 3, Vite, Vitest, Vue Router, Pinia, VitePress",
      icon: "V",
      color: "#42b883",
      pages: "9 docs",
    },
    {
      name: "TanStack",
      href: `${rootPrefix}tanstack/overview.html`,
      description: "TanStack Query, Router, Table, Form, Virtual",
      icon: "T",
      color: "#ef4444",
      pages: "9 docs",
    },
    {
      name: "Vercel",
      href: `${rootPrefix}vercel/overview.html`,
      description: "Next.js, SWR, Vercel AI SDK",
      icon: "▲",
      color: "#ffffff",
      pages: "8 docs",
    },
    {
      name: "Fastify",
      href: `${rootPrefix}fastify/overview.html`,
      description: "Fastify core, fastify-cors, fastify-sensible, fastify-autoload",
      icon: "F",
      color: "#00ccff",
      pages: "7 docs",
    },
    {
      name: "Svelte",
      href: `${rootPrefix}svelte/overview.html`,
      description: "Svelte compiler/runtime and SvelteKit",
      icon: "S",
      color: "#ff3e00",
      pages: "7 docs",
    },
  ];

  const cards = ecosystems
    .map(
      (e) => `
        <a href="${e.href}" class="eco-card" style="--card-color: ${e.color}">
          <div class="eco-card-icon">${e.icon}</div>
          <div class="eco-card-body">
            <h3>${e.name}</h3>
            <p>${e.description}</p>
          </div>
          <span class="eco-card-meta">${e.pages} →</span>
        </a>`
    )
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>How They Test</title>
  <link rel="stylesheet" href="${rootPrefix}styles/main.css">
</head>
<body class="landing">
  <a href="#main-content" class="skip-link">Skip to content</a>

  <div class="landing-bg">
    <div class="grid-overlay"></div>
  </div>

  <main class="landing-main" id="main-content">
    <div class="landing-hero">
      <div class="hero-badge">OPEN SOURCE RESEARCH</div>
      <h1 class="hero-title">
        <span class="hero-line">How They</span>
        <span class="hero-line hero-gradient">Test</span>
      </h1>
      <p class="hero-sub">
        Testing conventions and patterns from the world's most
        influential open-source ecosystems — extracted, documented,
        and ready to learn from.
      </p>

      <div class="hero-terminal">
        <div class="code-chrome">
          <span class="code-dots"><span></span><span></span><span></span></span>
          <span class="code-lang">TERMINAL</span>
        </div>
        <div class="hero-terminal-body">
          <div class="term-line"><span class="term-prompt">$</span> <span class="term-cmd">grep -r "describe\\|it\\|test" --include="*.spec.ts" | wc -l</span></div>
          <div class="term-line term-output">47,832 test cases analyzed</div>
          <div class="term-line"><span class="term-prompt">$</span> <span class="term-cmd">cat ecosystems.json</span></div>
          <div class="term-line term-output">{ "vue": 6, "tanstack": 5, "vercel": 3 } <span class="term-cursor">█</span></div>
        </div>
      </div>
    </div>

    <div class="eco-grid">
      ${cards}
    </div>

    <div class="landing-note">
      <p>These docs describe conventions found in project codebases, not personal styles. The testing patterns are shaped by entire core teams, community contributors, and years of evolution.</p>
    </div>
  </main>

  <script>
    // Typewriter effect for terminal
    const lines = document.querySelectorAll('.term-line');
    let delay = 400;
    lines.forEach((line, i) => {
      line.style.opacity = '0';
      line.style.transform = 'translateY(8px)';
      setTimeout(() => {
        line.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        line.style.opacity = '1';
        line.style.transform = 'translateY(0)';
      }, delay);
      delay += line.classList.contains('term-output') ? 600 : 400;
    });
  </script>
</body>
</html>`;
}

// ===== Build =====

async function build() {
  console.log("Building site...");

  const marked = await createMarkedInstance();

  // Clean & create dist
  await Bun.$`rm -rf ${DIST}`.quiet();
  await mkdir(DIST, { recursive: true });

  // Copy CSS
  await mkdir(STYLES_DEST, { recursive: true });
  await cp(STYLES_SRC, join(STYLES_DEST, "main.css"));

  // Collect all markdown files
  const mdFiles: string[] = [];
  const glob = new Glob("**/*.md");
  for await (const file of glob.scan({
    cwd: ROOT,
    onlyFiles: true,
  })) {
    // Exclude non-content directories
    if (
      file.startsWith("node_modules/") ||
      file.startsWith(".git/") ||
      file.startsWith(".agents/") ||
      file.startsWith(".claude/") ||
      file.startsWith("dist/")
    ) {
      continue;
    }
    mdFiles.push(file);
  }

  console.log(`Found ${mdFiles.length} markdown files`);

  // Process each markdown file
  for (const mdFile of mdFiles) {
    const srcPath = join(ROOT, mdFile);
    const htmlRelPath = mdToHtmlPath(mdFile);
    const destPath = join(DIST, htmlRelPath);

    // Root README → custom landing page
    if (mdFile === "README.md") {
      const fullHtml = landingTemplate("./");
      await mkdir(dirname(destPath), { recursive: true });
      await writeFile(destPath, fullHtml);
      console.log(`  ${mdFile} → ${htmlRelPath} (landing)`);
      continue;
    }

    // Read & parse
    const mdContent = await readFile(srcPath, "utf-8");
    const htmlContent = await marked.parse(mdContent);

    // Extract title from first H1
    const titleMatch = mdContent.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1] : basename(mdFile, ".md");

    // Determine current href for sidebar highlighting
    const currentHref = "/" + htmlRelPath;

    // Generate full HTML page
    const fullHtml = htmlTemplate(title, htmlContent, currentHref);

    // Write
    await mkdir(dirname(destPath), { recursive: true });
    await writeFile(destPath, fullHtml);
    console.log(`  ${mdFile} → ${htmlRelPath}`);
  }

  console.log(`\nDone! Site built in dist/`);
}

build().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});
