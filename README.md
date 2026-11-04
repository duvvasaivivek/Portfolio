# Duvva Sai Vivek — portfolio

A static, recruiter-focused portfolio with eight shareable project pages. HTML remains readable without JavaScript. No runtime build service, framework, or package installation is required for the website.

## Local development

Use Node.js 20 or newer:

```sh
npm run build
npm run check
npm run dev
```

Open `http://127.0.0.1:8766`. Stop the server with Ctrl+C. The preview server serves only public website paths, not Git or editor configuration.

## Editing content

On Windows, double-click `Open Portfolio.cmd` to start the local server and open the interactive Journey. Keep its window open; Ctrl+C stops the server. Opening `index.html` directly uses the browser's `file:` protocol, which blocks the module scripts required for 3D. A file-only notice now explains how to open the interactive preview.

- `js/data.js`: project details, internship and hackathon dates, skills, architecture layers.
- `js/profile.js`: current contact links, resume path, project stories, featured projects, and display order.
- `scripts/build.mjs`: homepage and case-study templates. Run `npm run build` after editing shared content or templates.
- `index.html` and `projects/*.html`: generated static pages; commit these for hosting. Do not edit them directly.
- `css/style.css`: responsive styles, print styles, and optional diagram layouts.
- `js/main.js`: navigation, clipboard, and the desktop 3D/simple-view switch.
- `scripts/journey-template.mjs`, `js/journey-ui.js`, and `js/journey-state.js`: timeline, filters, selection, and detail drawer. Previous/Next, named stops, and the jump menu share the same selection with the 3D camera. Arrow keys and Home/End navigate the milestone rail. The drawer follows the active filter.
- `js/scenes.js`: the restored Journey, project architecture, skills graph, and background spine. 3D starts automatically on desktop (1024px and wider). View switches in Projects and Journey disable it; `?no3d` starts in simple view. Switching 3D back on removes that URL flag. Mobile uses the accessible timeline. Reduced-motion preferences retain a stationary 3D Journey with instant, button-controlled milestone changes.
- `journeyOrder` in `js/data.js`: chronological milestone order, separate from stable IDs. Update it if adding or moving an event; the scene, drawer, and year markers follow it.

Current dates were confirmed by Vivek on 30 October 2026. Internship entries show the confirmed month; no unconfirmed start/end range is inferred. The current profile name is `duvvasaivivek`.

The Agentica stop reveals the existing event photograph, the 6th-of-240+ result, and a Civility case-study link. The Journey uses the original simple board-pin style: small matte heads on fine upright stems, a thin path, and a perspective grid. Selection changes the pin's color and size. Camera easing and subtle pointer parallax leave the HTML text stationary. Short desktop windows retain 3D with compact controls. Filters and navigation also work without WebGL. `npm run check` includes filter, selection, and camera-route tests.

## Resume

The website links to `Resumes/Duvva_Sai_Vivek_Resume_2026.pdf`. Earlier PDFs are preserved as historical files, are not linked from the website, and are excluded from the Vercel build output.

To regenerate the one-page PDF, install ReportLab in your Python environment and run:

```sh
python -m pip install reportlab
python scripts/build_resume.py
```

The script reads dates, contact details, and project links from the shared JavaScript content. Review the rendered PDF after changes to ensure it remains one page and the layout is readable.

## Publishing

For Vercel, the checked-in `vercel.json` runs `npm run build` and publishes `dist/`. The build copies the generated pages and website assets into that directory; `dist/` is ignored by Git. Push the configuration and build script changes, then deploy the new commit. No manual Output Directory override is required.

The existing canonical destination is `https://duvvasaivivek.github.io/Portfolio/`. For GitHub Pages, deploy the repository root with the generated HTML, CSS, JS, images, icons, and current resume. Run the build and checks before pushing through your existing deployment workflow. No new hosting service is needed.

## Verification

`npm run check` checks generated pages, local links and assets, anchors, duplicate IDs, corrected dates, the resume file, and JavaScript syntax. It does not assert that external repositories or demos are online.

Before publication, visually check the homepage and project pages at 360px, 768px, and 1280px widths; keyboard navigation; the menu's Escape behavior; PDF links; reduced motion; print preview; the scroll-driven Journey and milestone drawer; and switching between 3D and simple view. Measurements and model accuracy claims should only be added with their evaluation context. Architecture illustrations are labelled as diagrams; they are not product screenshots.
