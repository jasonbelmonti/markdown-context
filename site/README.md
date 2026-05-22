# markdown-context GitHub Pages Site

This directory contains the static GitHub Pages project for the
`@jasonbelmonti/markdown-context` release site.

## Local Preview

From the repository root:

```bash
python3 -m http.server 4173 --directory site
```

Open `http://localhost:4173`.

## Deployment

The workflow in `.github/workflows/pages.yml` uploads this directory as the
GitHub Pages artifact. Configure the repository Pages source to use GitHub
Actions before relying on automatic deployment.
