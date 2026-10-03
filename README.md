# Night Sky VR

A Quest 3 WebXR night-sky experiment built with Three.js and Vite.

## Local development

Requires Node.js 22 or newer.

```bash
npm install
npm run dev
```

Open the local URL shown by Vite on the Mac.

## Production build

```bash
npm run build
npm run preview
```

## GitHub Pages

This repository includes `.github/workflows/deploy-pages.yml`.

After pushing to GitHub:

1. Open **Settings → Pages** in the repository.
2. Under **Build and deployment**, choose **GitHub Actions** as the source.
3. Push to `main` (or run the Pages workflow manually from **Actions**).
4. GitHub will publish the built `dist/` directory over HTTPS.

Because `vite.config.js` uses `base: './'`, the build works from a project Pages URL such as:

`https://YOUR-USERNAME.github.io/night-sky-vr/`

## Milestone 1

- WebXR / Quest 3 immersive VR entry
- procedural 9,000-star celestial sphere
- subtle stellar colour variation
- dark-adaptation reveal
- star sphere follows viewer translation to avoid false parallax

## Next milestone

Replace the procedural field with real astronomical catalogue data, apparent magnitudes, and colour indices.
