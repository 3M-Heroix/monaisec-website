# MONAISEC website — V1

A responsive, static website built with plain HTML, CSS and JavaScript. It is designed for GitHub Pages and does not require a build step, database, framework, or paid hosting.

## Files
- `index.html` — complete website (styles and scripts included)

## Preview locally
Open `index.html` in a browser. For a local server, run:
```bash
python -m http.server 8000
```
Then visit http://localhost:8000.

## Publish with GitHub Pages
1. Create a GitHub repository, for example `monaisec-website`.
2. Upload `index.html` and this `README.md` to the repository root.
3. Open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select branch `main` and folder `/ (root)`, then Save.
6. Wait for GitHub to publish the site. The Pages panel will show the public URL.

## Connect monaisec.com
In the repository's **Settings → Pages**, enter `monaisec.com` under **Custom domain** and save. GitHub will add a `CNAME` file to the repository (or you can create one containing only `monaisec.com`).

At your domain registrar, configure the DNS records exactly as shown in GitHub's current Pages documentation. Commonly this involves GitHub Pages A records for the apex domain and a `www` CNAME pointing to your GitHub Pages hostname. Enable HTTPS in Pages once DNS verification is complete. DNS values can change, so use GitHub's current instructions rather than copying old records.

## Before launch — important edits
- Replace `contact@monaisec.com` and `research@monaisec.com` with inboxes you control.
- Review all wording to ensure it accurately reflects MONAISEC's current status and capabilities.
- The three research cards are **research themes / agendas**, not published papers. Replace them with actual publications only when they exist and have been reviewed.
- The Regulatory Intelligence button currently links to the European Commission's official AI policy page. Add other jurisdictions only when their sources and summaries are verified.
- Add a privacy notice if you later introduce analytics, forms, mailing lists, or other data collection.

## Notes
- Responsive navigation, in-page search, scroll reveals, animated wordmark reveal, mail links and anchor navigation work without a backend.
- The site respects `prefers-reduced-motion`.
- The Google Fonts import requires an internet connection; fallback fonts are provided.
- No analytics, cookies, user tracking, or contact form backend are included in this version.
