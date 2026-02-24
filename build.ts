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
      { title: "Overview", href: "/vue-ecosystem/overview.html", file: "docs/vue-ecosystem/overview.md" },
      { title: "Test Organization", href: "/vue-ecosystem/test-organization.html", file: "docs/vue-ecosystem/test-organization.md" },
      { title: "No Import Mocks", href: "/vue-ecosystem/no-import-mocks.html", file: "docs/vue-ecosystem/no-import-mocks.md" },
      { title: "Architectural DI", href: "/vue-ecosystem/architectural-di.html", file: "docs/vue-ecosystem/architectural-di.md" },
      { title: "Mocking Patterns", href: "/vue-ecosystem/mocking-patterns.html", file: "docs/vue-ecosystem/mocking-patterns.md" },
      { title: "Test Utilities", href: "/vue-ecosystem/test-utilities.html", file: "docs/vue-ecosystem/test-utilities.md" },
      { title: "Testing by Subsystem", href: "/vue-ecosystem/testing-by-subsystem.html", file: "docs/vue-ecosystem/testing-by-subsystem.md" },
      { title: "E2E & Integration", href: "/vue-ecosystem/e2e-and-integration.html", file: "docs/vue-ecosystem/e2e-and-integration.md" },
      { title: "Per-Project Breakdown", href: "/vue-ecosystem/per-project-breakdown.html", file: "docs/vue-ecosystem/per-project-breakdown.md" },
    ],
  },
  {
    name: "TanStack",
    dir: "tanstack",
    items: [
      { title: "Overview", href: "/tanstack/overview.html", file: "docs/tanstack/overview.md" },
      { title: "Test Organization", href: "/tanstack/test-organization.html", file: "docs/tanstack/test-organization.md" },
      { title: "Core/Adapter Split", href: "/tanstack/core-adapter-split.html", file: "docs/tanstack/core-adapter-split.md" },
      { title: "Mocking Patterns", href: "/tanstack/mocking-patterns.html", file: "docs/tanstack/mocking-patterns.md" },
      { title: "Dependency Injection", href: "/tanstack/dependency-injection.html", file: "docs/tanstack/dependency-injection.md" },
      { title: "Test Utilities", href: "/tanstack/test-utilities.html", file: "docs/tanstack/test-utilities.md" },
      { title: "Async Testing", href: "/tanstack/async-testing.html", file: "docs/tanstack/async-testing.md" },
      { title: "Type Testing", href: "/tanstack/type-testing.html", file: "docs/tanstack/type-testing.md" },
      { title: "Per-Project Breakdown", href: "/tanstack/per-project-breakdown.html", file: "docs/tanstack/per-project-breakdown.md" },
    ],
  },
  {
    name: "Vercel",
    dir: "vercel",
    items: [
      { title: "Overview", href: "/vercel/overview.html", file: "docs/vercel/overview.md" },
      { title: "Test Organization", href: "/vercel/test-organization.html", file: "docs/vercel/test-organization.md" },
      { title: "Mocking Patterns", href: "/vercel/mocking-patterns.html", file: "docs/vercel/mocking-patterns.md" },
      { title: "Test Harnesses", href: "/vercel/test-harnesses.html", file: "docs/vercel/test-harnesses.md" },
      { title: "Test Utilities", href: "/vercel/test-utilities.html", file: "docs/vercel/test-utilities.md" },
      { title: "E2E & Integration", href: "/vercel/e2e-and-integration.html", file: "docs/vercel/e2e-and-integration.md" },
      { title: "Rust Testing", href: "/vercel/rust-testing.html", file: "docs/vercel/rust-testing.md" },
      { title: "Per-Project Breakdown", href: "/vercel/per-project-breakdown.html", file: "docs/vercel/per-project-breakdown.md" },
    ],
  },
  {
    name: "Fastify",
    dir: "fastify",
    items: [
      { title: "Overview", href: "/fastify/overview.html", file: "docs/fastify/overview.md" },
      { title: "Test Organization", href: "/fastify/test-organization.html", file: "docs/fastify/test-organization.md" },
      { title: "The Inject Pattern", href: "/fastify/inject-pattern.html", file: "docs/fastify/inject-pattern.md" },
      { title: "Plugin Testing", href: "/fastify/plugin-testing.html", file: "docs/fastify/plugin-testing.md" },
      { title: "Mocking Patterns", href: "/fastify/mocking-patterns.html", file: "docs/fastify/mocking-patterns.md" },
      { title: "Test Utilities", href: "/fastify/test-utilities.html", file: "docs/fastify/test-utilities.md" },
      { title: "Per-Project Breakdown", href: "/fastify/per-project-breakdown.html", file: "docs/fastify/per-project-breakdown.md" },
    ],
  },
  {
    name: "Svelte",
    dir: "svelte",
    items: [
      { title: "Overview", href: "/svelte/overview.html", file: "docs/svelte/overview.md" },
      { title: "Test Organization", href: "/svelte/test-organization.html", file: "docs/svelte/test-organization.md" },
      { title: "Compiler Testing", href: "/svelte/compiler-testing.html", file: "docs/svelte/compiler-testing.md" },
      { title: "Runtime Testing", href: "/svelte/runtime-testing.html", file: "docs/svelte/runtime-testing.md" },
      { title: "SvelteKit Testing", href: "/svelte/sveltekit-testing.html", file: "docs/svelte/sveltekit-testing.md" },
      { title: "Test Utilities", href: "/svelte/test-utilities.html", file: "docs/svelte/test-utilities.md" },
      { title: "Per-Project Breakdown", href: "/svelte/per-project-breakdown.html", file: "docs/svelte/per-project-breakdown.md" },
    ],
  },
  {
    name: "Angular",
    dir: "angular",
    items: [
      { title: "Overview", href: "/angular/overview.html", file: "docs/angular/overview.md" },
      { title: "Test Organization", href: "/angular/test-organization.html", file: "docs/angular/test-organization.md" },
      { title: "TestBed Patterns", href: "/angular/testbed-patterns.html", file: "docs/angular/testbed-patterns.md" },
      { title: "Component Testing", href: "/angular/component-testing.html", file: "docs/angular/component-testing.md" },
      { title: "Mocking Patterns", href: "/angular/mocking-patterns.html", file: "docs/angular/mocking-patterns.md" },
      { title: "Test Utilities", href: "/angular/test-utilities.html", file: "docs/angular/test-utilities.md" },
      { title: "Per-Project Breakdown", href: "/angular/per-project-breakdown.html", file: "docs/angular/per-project-breakdown.md" },
    ],
  },
  {
    name: "React",
    dir: "react",
    items: [
      { title: "Overview", href: "/react/overview.html", file: "docs/react/overview.md" },
      { title: "Test Organization", href: "/react/test-organization.html", file: "docs/react/test-organization.md" },
      { title: "Module Re-requiring", href: "/react/module-re-requiring.html", file: "docs/react/module-re-requiring.md" },
      { title: "ReactNoop Renderer", href: "/react/react-noop-renderer.html", file: "docs/react/react-noop-renderer.md" },
      { title: "Mocking Patterns", href: "/react/mocking-patterns.html", file: "docs/react/mocking-patterns.md" },
      { title: "Test Utilities", href: "/react/test-utilities.html", file: "docs/react/test-utilities.md" },
      { title: "Per-Project Breakdown", href: "/react/per-project-breakdown.html", file: "docs/react/per-project-breakdown.md" },
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
  <link rel="icon" href="${rootPrefix}styles/logo.svg" type="image/svg+xml">
  <meta property="og:title" content="${title} — How They Test">
  <meta property="og:description" content="Testing conventions and patterns from the world's most influential open-source ecosystems.">
  <meta property="og:image" content="${rootPrefix}styles/og-image.svg">
  <meta property="og:type" content="article">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="stylesheet" href="${rootPrefix}styles/main.css">
</head>
<body>
  <a href="#main-content" class="skip-link">Skip to content</a>

  <header class="site-header">
    <button class="menu-toggle" aria-label="Toggle navigation">☰</button>
    <a href="${rootPrefix}index.html" class="site-logo"><img src="${rootPrefix}styles/logo.svg" alt="" width="24" height="24">How They Test</a>
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
    {
      name: "Angular",
      href: `${rootPrefix}angular/overview.html`,
      description: "Angular core, compiler, router, forms, CDK, Material",
      icon: "A",
      color: "#dd0031",
      pages: "7 docs",
    },
    {
      name: "React",
      href: `${rootPrefix}react/overview.html`,
      description: "React core, DOM renderer, reconciler, concurrent features",
      icon: "R",
      color: "#61dafb",
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
  <link rel="icon" href="${rootPrefix}styles/logo.svg" type="image/svg+xml">
  <meta property="og:title" content="How They Test">
  <meta property="og:description" content="Testing conventions and patterns from the world's most influential open-source ecosystems.">
  <meta property="og:image" content="${rootPrefix}styles/og-image.svg">
  <meta property="og:type" content="website">
  <meta name="twitter:card" content="summary_large_image">
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
          <div class="term-line term-copyable"><span class="term-prompt">$</span> <span class="term-cmd">npx skills add mikitahimpel/how-they-test</span><button class="copy-btn" aria-label="Copy command" onclick="navigator.clipboard.writeText('npx skills add mikitahimpel/how-they-test').then(()=>{this.textContent='Copied!';setTimeout(()=>this.textContent='Copy',1500)})">Copy</button></div>
          <div class="term-line term-output">✓ Installed how-they-test</div>
          <div class="term-line term-output term-dim">  7 principles · 7 reference files · 4 runners supported</div>
          <div class="term-line"><span class="term-prompt">$</span> <span class="term-cmd">npx skills list</span></div>
          <div class="term-line term-output">how-they-test <span class="term-dim">— testing best practices from 47k+ test cases</span></div>
          <div class="term-line"><span class="term-prompt">$</span> <span class="term-cursor">█</span></div>
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

  // Copy CSS and assets
  await mkdir(STYLES_DEST, { recursive: true });
  await cp(STYLES_SRC, join(STYLES_DEST, "main.css"));
  await cp(join(ROOT, "styles", "logo.svg"), join(STYLES_DEST, "logo.svg"));
  await cp(join(ROOT, "styles", "og-image.svg"), join(STYLES_DEST, "og-image.svg"));

  // Collect all markdown files from docs/ directory
  const DOCS = join(ROOT, "docs");
  const mdFiles: string[] = [];

  // Add root README (lives outside docs/)
  mdFiles.push("README.md");

  // Scan docs/ for ecosystem markdown files
  const glob = new Glob("**/*.md");
  for await (const file of glob.scan({
    cwd: DOCS,
    onlyFiles: true,
  })) {
    mdFiles.push(`docs/${file}`);
  }

  console.log(`Found ${mdFiles.length} markdown files`);

  // Process each markdown file
  for (const mdFile of mdFiles) {
    const srcPath = join(ROOT, mdFile);
    // Strip docs/ prefix for output paths so URLs stay clean
    const outputRelPath = mdFile.startsWith("docs/") ? mdFile.slice(5) : mdFile;
    const htmlRelPath = mdToHtmlPath(outputRelPath);
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
