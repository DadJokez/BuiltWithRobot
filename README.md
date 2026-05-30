This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Adding Portfolio Tiles

Add private, client, or manually curated projects in `src/data/projects.ts`.
Each object in the `projects` array becomes one tile on the homepage:

```ts
{
  id: "project-slug",
  title: "Project Name",
  description: "A short, polished description of what it does.",
  tags: ["Next.js", "AI", "Dashboard"],
  kind: "live",
  statusLabel: "Live app",
  visual: {
    type: "screenshot",
    src: "/projects/project-slug.png",
    alt: "Project Name homepage screenshot",
  },
  primaryAction: {
    label: "Open site",
    href: "https://example.com",
  },
  url: "https://example.com",
  date: "2026-05",
}
```

The homepage uses this curated list directly, so placeholder or private repos
will not appear unless you add them here.

Use `kind: "repo"` or `kind: "private"` with an `artifact` visual when a
project should link to source code, a write-up, or a login-gated app instead of
a public live screenshot.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
