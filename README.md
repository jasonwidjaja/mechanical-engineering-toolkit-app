# Engineering Toolkit

A collection of engineering calculators built with **Next.js**, **TypeScript**, and **Tailwind CSS**.

**🔗 Live site: https://mech-toolkit.vercel.app**

---

## Quick Start

```bash
npm install     # first time only
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

---

## What's Inside

```
src/
├── app/                                  ← Every folder here = a URL route
│   ├── layout.tsx                        ← Site-wide shell (nav bar, fonts)
│   ├── page.tsx                          ← Home page + the calculator registry
│   ├── globals.css                       ← Tailwind base styles + design tokens
│   ├── calculators/                      ← 16 calculators, one folder each
│   │   ├── bolt-torque/page.tsx
│   │   ├── wind-load/page.tsx
│   │   └── ...
│   ├── materials/page.tsx                ← Materials database
│   ├── dfm-guide/page.tsx                ← Design-for-manufacturing guide
│   ├── mechanisms-reference/page.tsx     ← Mechanisms reference
│   └── tolerance-stackup/page.tsx        ← Tolerance stack-up tool
│
├── components/                           ← Reusable React components
│   ├── ui/                               ← Shared building blocks
│   │   ├── DataTable.tsx                 ← Sortable data table
│   │   ├── Gauge.tsx                     ← Pass/fail gauge readout
│   │   ├── SectionHeading.tsx
│   │   ├── TabButton.tsx
│   │   ├── ResourceList.tsx
│   │   └── MaterialsDbLink.tsx           ← Cross-link into /materials
│   ├── dfm/                              ← SVG diagrams for the DFM guide
│   ├── mechanisms/                       ← SVG diagrams for mechanisms
│   └── *.tsx                             ← Calculator-specific diagrams
│
└── lib/                                  ← Plain data + math, no UI
    ├── materials.ts                      ← Material property database
    ├── galvanic.ts                        ← Galvanic series data
    ├── oring-constants.ts                ← O-ring standard sizes
    ├── dfm-data.ts
    └── mechanisms-data.ts
```

Every folder inside `app/` with a `page.tsx` file becomes a URL route automatically — that's the **App Router** convention Next.js uses. Anything in `components/` or `lib/` is *not* a route; it's imported by pages.

**Rule of thumb for where code goes:**
- Numbers, tables, constants → `src/lib/`
- Anything visual reused on 2+ pages → `src/components/ui/`
- A diagram used by one page → `src/components/`
- The page itself → `src/app/.../page.tsx`

---

## How It Was Built — A Beginner's Guide

### 1. Why Next.js?

Plain React gives you components and state management, but it doesn't decide *how* to serve your app to the browser. Next.js wraps React and adds:

- **File-based routing** — create a file, get a URL. No manual router config.
- **Server-side rendering / static generation** — pages can be pre-built at deploy time, making them load instantly.
- **Built-in dev server** with hot reload — save a file and the browser updates automatically.

### 2. App Router vs Pages Router

Next.js has two routing systems. This project uses the **App Router** (the newer one, introduced in Next.js 13). The rules are simple:

| File | What it does |
|------|--------------|
| `app/layout.tsx` | Wraps every page. Think of it as the outer frame of every screen. |
| `app/page.tsx` | The content at `/` (the home page). |
| `app/calculators/bolt-torque/page.tsx` | The content at `/calculators/bolt-torque`. |

The **URL path mirrors the folder path**. To add a new calculator, create a new folder and drop a `page.tsx` inside it.

### 3. TypeScript

TypeScript is JavaScript with *types* added on top. It catches mistakes before you run the code:

```ts
// Without TypeScript — JavaScript would let this silently pass wrong data in
function add(a, b) { return a + b; }

// With TypeScript — the editor flags mistakes immediately
function add(a: number, b: number): number { return a + b; }
```

In this project, types are used for things like describing what props (properties) a component expects:

```ts
type InputFieldProps = {
  label: string;
  unit: string;
  value: string;
  onChange: (v: string) => void; // a function that receives a string and returns nothing
  error?: string;                // the ? means this field is optional
};
```

### 4. React Components and State

**Components** are the building blocks of React UIs — they're JavaScript functions that return HTML-like markup (called JSX):

```tsx
function Greeting({ name }: { name: string }) {
  return <h1>Hello, {name}!</h1>;  // curly braces inject JavaScript into the markup
}
```

**State** is data that can change over time and trigger a re-render when it does. The `useState` hook manages state:

```tsx
const [count, setCount] = useState(0); // initial value is 0
// count  → the current value
// setCount → call this to update it; React re-renders the component automatically
```

The Bolt Torque Calculator stores its three inputs and the result as state:

```tsx
const [diameter, setDiameter] = useState("");  // empty string = nothing typed yet
const [result, setResult] = useState(null);    // null = no calculation done yet
```

### 5. Tailwind CSS

Tailwind is a "utility-first" CSS framework. Instead of writing a separate `.css` file, you apply small, descriptive classes directly in the markup:

```tsx
<button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
  Click me
</button>
```

Each class does exactly one thing:
- `bg-blue-600` → background color (blue, shade 600)
- `text-white` → white text
- `px-4` → horizontal padding of 1rem
- `py-2` → vertical padding of 0.5rem
- `rounded-lg` → large border radius
- `hover:bg-blue-700` → darker blue on mouse hover

You can scan any JSX file and understand the design without opening a separate stylesheet.

### 6. The Bolt Torque Formula

The calculator implements the **nut factor (K-factor) torque equation**, the most common formula for estimating bolt tightening torque:

```
T = K × F × d
```

Where:
- **T** = tightening torque (N·m)
- **K** = torque coefficient / nut factor (dimensionless) — accounts for thread and bearing-face friction
- **F** = desired preload / clamp force (N)
- **d** = nominal bolt diameter (**in meters**, converted from the mm input)

The result is also shown in **lb·ft** using the conversion factor `1 N·m = 0.7376 lb·ft`.

Typical K values:
| Condition | K |
|-----------|---|
| Lubricated (oil or wax) | 0.10 – 0.15 |
| Plain/dry steel | 0.20 |
| Zinc-plated (galvanized) | 0.17 – 0.22 |
| Stainless on stainless | 0.20 – 0.30 |

### 7. Validation Logic

Before calculating, the `validate()` function checks each input:

```ts
if (!diameter.trim()) errs.diameter = "Bolt diameter is required.";
else if (isNaN(d) || d <= 0) errs.diameter = "Must be a positive number.";
```

`validate()` returns an object — if it's empty (`{}`), all fields are valid and the calculation proceeds. If it has entries, they're stored in the `errors` state and displayed as red text below the relevant inputs.

### 8. Client vs Server Components

By default, App Router components run on the **server** — they're rendered to HTML before being sent to the browser. This is great for performance, but server components can't use browser features like `useState` or `onClick`.

The Bolt Torque page starts with:

```ts
"use client";
```

This line tells Next.js to run the component in the browser. Use `"use client"` whenever you need:
- `useState` / `useEffect` hooks
- Event handlers (`onClick`, `onChange`)
- Browser APIs (localStorage, etc.)

---

## Adding a New Calculator

1. **Create the route folder:** `src/app/calculators/your-calculator-name/`
   The folder name becomes the URL, so use lowercase-with-hyphens.

2. **Add `page.tsx` inside it.** Copy an existing calculator as a starting point —
   `bolt-torque/page.tsx` is the simplest, `wind-load/page.tsx` shows a more
   involved one with diagrams and a `Gauge`.

3. **Register it on the home page.** Open `src/app/page.tsx` and find the
   `calculators` array (grouped by category). Add an entry:

   ```ts
   {
     name: "Your Calculator",
     description: "One-line summary shown on the home card.",
     href: "/calculators/your-calculator-name",
     icon: "...",
     status: "available",   // use "coming-soon" to show a greyed-out card
   }
   ```

   If you'd previously stubbed it as `"coming-soon"`, just flip that to `"available"`.

4. **Reuse the shared pieces** rather than restyling from scratch:
   `Gauge` for pass/fail readouts, `DataTable` for tables, `SectionHeading`,
   `TabButton`, and `MaterialsDbLink` to cross-link into `/materials`.

5. **Put constants and math in `src/lib/`**, not in the page — that keeps the
   numbers reusable and the page focused on layout.

6. **Check it locally,** then commit and push (see *Deploying* below):
   ```bash
   npm run dev      # visit http://localhost:3000/calculators/your-calculator-name
   npm run build    # catches TypeScript errors that dev mode lets slide
   ```

Next.js picks up the new route automatically — no router config to edit.

### Adding a material

Materials live in `src/lib/materials.ts`. Add an object to the exported array and
it flows through to `/materials` and every calculator that offers a material
picker. Keep the units consistent with the existing entries.

---

## Available Scripts

| Command | What it does |
|---------|-------------|
| `npm run dev` | Start the local dev server at http://localhost:3000 |
| `npm run build` | Build an optimized production bundle (**run this before pushing**) |
| `npm run start` | Serve the production build locally |
| `npm run lint` | Run ESLint to catch code style issues |

---

## Deploying & Updating the Live Site

The site is hosted on **Vercel** at
**https://mech-toolkit.vercel.app**

- Vercel project: `engineering-toolkit` (owner: `jasonwidjaja's projects`)
- Dashboard: https://vercel.com/jasonwidjajas-projects/engineering-toolkit
- Source repo: https://github.com/jasonwidjaja/mechanical-engineering-toolkit-app

**About the URLs.** Vercel gives a project several addresses that all point at the
same live deployment, so more than one link will work:

| URL | What it is |
|-----|-----------|
| `mech-toolkit.vercel.app` | The one to share. Added by hand. |
| `engineering-toolkit-alpha.vercel.app` | Auto-assigned original. Still works — old links won't break. |
| `engineering-toolkit-<hash>-...vercel.app` | A specific frozen build. Never changes, useful for comparing against an old version. |

Vercel appended `-alpha` to the original name only because
`engineering-toolkit.vercel.app` was already claimed by an unrelated account — it
was never a pre-release marker. Note that plain `engineering-toolkit.vercel.app`
loads a **stranger's site**, not yours, so don't share that one by mistake.

To add or change a name later: **Settings → Domains** in the dashboard, or
`npx vercel domains add <name>.vercel.app engineering-toolkit`. Adding a name
never removes existing ones.

### The normal way to update: just push

The Vercel project is connected to the GitHub repo, so **every push to `main`
automatically builds and deploys to the live URL.** The usual loop is:

```bash
npm run build                  # make sure it compiles before you push
git add .
git commit -m "Describe your change"
git push
```

Wait ~1 minute, then reload the live URL. You can watch the build progress in the
Vercel dashboard under **Deployments**.

Pushing to any *other* branch creates a **preview deployment** — its own
throwaway URL — without touching the live site. That's the safe way to try
something risky:

```bash
git checkout -b try-new-thing
git push -u origin try-new-thing    # Vercel comments the preview URL on GitHub
```

### Deploying manually from your computer

Useful if you want to publish without committing, or if the GitHub connection
breaks:

```bash
npx vercel           # deploy current folder to a preview URL
npx vercel --prod    # deploy current folder straight to the live URL
```

You're already logged in; `npx vercel whoami` should print `jasonwidjaja`.
If it doesn't, run `npx vercel login`.

### Undoing a bad deploy

The fastest fix is to roll back — this is instant and doesn't require a rebuild:

1. Vercel dashboard → **Deployments**
2. Find the last deployment that was good
3. **⋯** menu → **Promote to Production**

Or from the terminal:

```bash
npx vercel rollback           # revert to the previous production deployment
npx vercel ls                 # list recent deployments
npx vercel logs <url>         # see build/runtime logs for a deployment
```

Then fix the problem in the code and push again as normal.

### If a deploy fails

Vercel runs the exact same `npm run build` you can run locally, so a failing
deploy almost always fails locally too. Run `npm run build` and read the first
error. The most common causes are TypeScript type errors and importing something
that doesn't exist — dev mode is more forgiving than the production build, which
is why it's worth building before you push.

### Environment variables (not currently needed)

This app is fully static and uses no secrets or API keys. If you ever add one:

1. Vercel dashboard → **Settings → Environment Variables**, or `npx vercel env add`
2. Add the same variable to a local `.env.local` file for development
3. Redeploy — env var changes don't apply to already-built deployments

Never commit `.env.local` or the `.vercel/` folder; both are already in `.gitignore`.

### Using a custom domain

Buy a domain, then: Vercel dashboard → **Settings → Domains → Add**, and follow
the DNS instructions it gives you. Or `npx vercel domains add yourdomain.com`.

---

## Tech Stack

| Tool | Version | Purpose |
|------|---------|---------|
| [Next.js](https://nextjs.org) | 16.x | React framework + routing |
| [React](https://react.dev) | 19.x | UI component library |
| [TypeScript](https://www.typescriptlang.org) | 5.x | Type-safe JavaScript |
| [Tailwind CSS](https://tailwindcss.com) | 3.x | Utility-first CSS |
| [Recharts](https://recharts.org) | 3.x | Charts in the DFM guide and calculators |
| [Vercel](https://vercel.com) | — | Hosting + automatic deploys on `git push` |
