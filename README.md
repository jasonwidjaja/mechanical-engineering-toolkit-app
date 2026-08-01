# Engineering Toolkit

A collection of engineering calculators built with **Next.js**, **TypeScript**, and **Tailwind CSS**.

---

## Quick Start

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

---

## What's Inside

```
src/
└── app/
    ├── layout.tsx                      ← Site-wide shell (nav bar, shared styles)
    ├── page.tsx                        ← Home page (calculator card grid)
    ├── globals.css                     ← Tailwind base styles
    └── calculators/
        └── bolt-torque/
            └── page.tsx               ← Bolt Torque Calculator
```

Every folder inside `app/` with a `page.tsx` file becomes a URL route automatically — that's the **App Router** convention Next.js uses.

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

1. Create a new folder: `src/app/calculators/your-calculator-name/`
2. Add a `page.tsx` file inside it (copy `bolt-torque/page.tsx` as a starting point)
3. Add a new entry to the `calculators` array in `src/app/page.tsx` and change `status` from `"coming-soon"` to `"available"`

That's it — Next.js picks up the new route automatically.

---

## Available Scripts

| Command | What it does |
|---------|-------------|
| `npm run dev` | Start the local dev server at http://localhost:3000 |
| `npm run build` | Build an optimized production bundle |
| `npm run start` | Serve the production build locally |
| `npm run lint` | Run ESLint to catch code style issues |

---

## Tech Stack

| Tool | Version | Purpose |
|------|---------|---------|
| [Next.js](https://nextjs.org) | 16.x | React framework + routing |
| [React](https://react.dev) | 19.x | UI component library |
| [TypeScript](https://www.typescriptlang.org) | 5.x | Type-safe JavaScript |
| [Tailwind CSS](https://tailwindcss.com) | 3.x | Utility-first CSS |
