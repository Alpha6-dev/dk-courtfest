# DK CourtFest (courtfest.com)

Event platform for the Dakar street basketball event: React 19 + Vite + Tailwind 4 + TypeScript with a Supabase backend. See README.md for the feature map, DEPLOY.md for hosting and PAYMENTS.md for payments.

## Working rules

- House style: never use the em dash character (U+2014) anywhere: copy, code, comments, docs, commit messages. The deploy workflow fails if it reaches index.html, src, supabase or the docs. Use a comma, a period, a colon (French text keeps a non-breaking space before it), parentheses or a plain hyphen instead; titles and labels use the brand's middle dot separator. To search for or strip the character, use a code point such as chr(8212) or String.fromCharCode(0x2014).
- Every push to main deploys to courtfest.com through GitHub Pages, and Alpha6GitSync commits and pushes each saved file within seconds. For a multi-file change, pause the sync (see ../CLAUDE.md), commit once with a descriptive message, then resume.
- The landing page is plain HTML in two files that must stay in sync: src/pages/courtfest-landing.html (French) and src/pages/courtfest-landing.en.html (English), injected by src/pages/Home.tsx together with the page-scoped src/pages/courtfest-landing.css. Copy changes go in both HTML files; layout changes go in the CSS (the markup is inline-styled, so responsive rules need !important). Grids marked data-mg collapse to one column under 780px.
- Local run: npm install, copy .env.example to .env with the public Supabase values from .github/workflows/deploy.yml, then npm run dev (the desktop launch config uses port 3003). Check phone widths from 320 to 414px as well as desktop: the document must never be wider than the viewport, or phones zoom out.
- The Supabase project rvgzydyrsnwcygfshryi is shared with other Alpha 6 products (tables prefixed bebey_, crm_, ct_, fin_). Touch only this app's tables, and apply schema or data changes both as a numbered file in supabase/migrations and through the Supabase migration tool so the repository and the database stay in step.
