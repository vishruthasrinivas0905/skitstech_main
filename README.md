# SKLS Legal Solutions Website

A responsive legal and intellectual property consultancy website for Satatham Kritam Legal Solutions LLP (SKLS). The build follows the design notes in the supplied image: SKLS branding with red initials, a navy/black visual identity representing law and technology, and dedicated Home, About, Team, IP Tools, News, Wisdom and Contact destinations. The home page also includes an **Our Legal Partners** section.

The supplied public website was used as a source for firm positioning, public contact details, practice areas, selected team roles, FAQs, and example news subjects. This is a fresh implementation, not a copy of the site's source code. Legal copy and firm facts should be reviewed by SKLS before production publication.

## Stack

- **Frontend:** semantic HTML, CSS and browser-native JavaScript. No frontend build step or framework dependency is required.
- **Backend:** Node.js 20+ built-in HTTP server and JSON API.
- **Database:** MongoDB Atlas or self-hosted MongoDB, accessed through the official MongoDB Node.js driver. MongoDB is optional for the local demo, required for durable production inquiries.
- **Edge / hosting:** deploy the Node app to a Node-compatible host (for example, a container host) and use Cloudflare for DNS, TLS, CDN caching and security controls. The API relies on a Node MongoDB driver, so it is not a static-only Cloudflare Pages/Workers deployment.

## Quick start (Windows PowerShell)

Install [Node.js 20 or newer](https://nodejs.org/) first. Extract the ZIP, open PowerShell, and run these commands from the extracted project folder:

```powershell
cd "C:\path\to\the\extracted\skls-legal-solutions-website"
npm install
npm start
```

Keep that PowerShell window open while using the site. Open **http://localhost:3000** in your browser. To stop the local server, press **Ctrl+C** in PowerShell.

The contact form runs in demo-memory mode without MongoDB configuration. To save enquiries persistently, copy `.env.example` to `.env` and set the MongoDB values in your shell before starting the server. See [MongoDB setup](#mongodb-setup) below.

## Project layout

```text
.
├── public/
│   ├── assets/favicon.svg       # SKLS browser icon
│   ├── css/styles.css           # Theme, responsive layout, accessible states
│   ├── js/app.js                # Navigation, IP tool dialogs, audio, contact form
│   └── index.html               # Site content and semantic page structure
├── server/index.js              # Static-file server and contact API
├── tests/site.test.js           # HTTP/API integration checks
├── .env.example                 # Environment variable template (no secrets)
├── Dockerfile                   # Container image for Node hosting
├── package.json                 # Scripts and the MongoDB driver dependency
└── README.md                    # Setup, deployment and maintenance guide
```

## Run locally

Requirements: Node.js 20 or newer and npm.

1. Install the MongoDB driver: `npm install`.
2. Optional: copy `.env.example` to `.env` and fill in the Atlas URI and database name. The server does not load `.env` files automatically; export the variables in your terminal or use a local environment loader of your choice.
3. Start the server: `npm start` (or `npm run dev` for Node's watch mode).
4. Open [http://localhost:3000](http://localhost:3000).

### MongoDB setup

For a persistent local MongoDB connection, create a `.env` file from `.env.example`, then set the variables in PowerShell before running `npm start`. For example:

```powershell
$env:MONGODB_URI = "mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority"
$env:MONGODB_DB = "skls_website"
npm start
```

Replace the placeholders with your own MongoDB Atlas connection details. Keep the URI private and do not commit it. The Node server does not automatically read `.env`; environment variables must be exported in the shell or loaded with a local environment loader.

Without `MONGODB_URI`, the contact endpoint uses an in-memory demo mode. Submissions are acknowledged but disappear when the server restarts. Set a valid connection string to enable persistent MongoDB storage. The app creates the configured inquiry collection and an index on `createdAt` after it connects.

### Environment variables

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `PORT` | No | `3000` | HTTP port |
| `MONGODB_URI` | Production | none | MongoDB connection string; keep it secret |
| `MONGODB_DB` | No | `skls_website` | Database that stores inquiries |
| `CONTACT_COLLECTION` | No | `contact_inquiries` | Collection for contact requests |
| `ALLOWED_ORIGIN` | No | `*` | CORS origin for API calls; set to the production site origin when cross-origin calls are needed |

Contact records contain name, email, optional phone, selected topic, message, consent, source and creation time. Restrict database access to the application, use TLS, set an appropriate retention policy, and do not commit credentials. This minimal project deliberately has no public inquiry-reading endpoint or admin dashboard.

## API

- `GET /api/health` — process health and current storage mode (`mongodb` or `demo-memory`). Does not expose secrets.
- `POST /api/contact` — accepts JSON `{ "name", "email", "phone?", "service?", "message", "consent", "website?" }`. Returns `201` on accepted submissions, `422` for validation issues, and `400` for malformed or oversized bodies. The hidden `website` honeypot field suppresses simple bot submissions.

The API validates basic required fields and length limits. For a public production launch, add rate limiting (at the host or Cloudflare), monitoring, spam controls, privacy/retention policy and an operational process for reading and responding to inquiries. Do not treat an accepted API response as proof of email delivery; this build stores inquiries but does not send notification email.

## Production deployment

### Container host + Cloudflare (recommended for this Node/MongoDB build)

1. Create a MongoDB Atlas cluster, a database user with access only to the target database, and an IP/network access rule appropriate to your app host. Do not use broad public database access in production if the host supports fixed egress IPs or private networking.
2. Build and run the included Dockerfile, or deploy this repository to a Node-compatible service with `npm install` and `npm start`.
3. Configure `MONGODB_URI`, `MONGODB_DB`, and `PORT` as host secrets/environment variables. Set `ALLOWED_ORIGIN` to the site's exact origin if serving the API on a separate hostname.
4. Point the domain's DNS record through Cloudflare to the app host. Enable HTTPS, redirect HTTP to HTTPS, and use Cloudflare caching for static files only; do not cache `/api/*` or `/` HTML in a way that hides new content.
5. Verify `/api/health`, submit a non-confidential test inquiry, confirm the record in MongoDB, then delete the test record.
6. Add application monitoring, backups, alerting, rate limiting and a reviewed privacy notice before accepting public inquiries.

Cloudflare Pages by itself can serve the static `public/` directory, but the contact API and MongoDB driver in this repository need a compatible Node backend. Do not deploy only `public/` and expect persistent contact submissions to work. A Workers port would require adapting the API and Mongo access strategy to Workers-compatible services (for example, a separately hosted API or a supported MongoDB-compatible data service).

### Docker

```sh
docker build -t skls-website .
docker run --rm -p 3000:3000 \
  -e PORT=3000 \
  -e MONGODB_URI='mongodb+srv://...' \
  -e MONGODB_DB=skls_website \
  skls-website
```

Pass secrets through your hosting provider, not in a committed `.env` file or image layer. The container runs as a non-root user.

## Content and maintenance

- Edit page structure and copy in `public/index.html`.
- Edit design tokens, breakpoints and layout in `public/css/styles.css`. Colors and fonts are defined near the top in `:root`.
- Edit client-side behavior in `public/js/app.js`.
- Edit API validation, storage and HTTP behavior in `server/index.js`.
- Team portrait blocks are original typographic illustrations, not photographs. Replace them with approved, licensed team photos only after the firm supplies them. Do not imply illustrated portraits are real photographs.
- Placeholder-like aggregate claims or public facts must be confirmed before launch. No live third-party news feed or CMS is included; update the hand-maintained News cards in `index.html` as content is approved.
- The listening control uses the browser's built-in speech synthesis and voice, when available; it is not a recorded firm narration.
- Current site is a single-page layout with hash-linked sections. Add real routes/content management only if those are needed operationally.

## Checks

Run `npm test` to syntax-check the server/client scripts and exercise the health endpoint, validation, contact submission, and static content over HTTP. Tests start an isolated local server and do not require MongoDB. Run `npm run check` for syntax checks only.

## Important legal note

This website is general information, not legal advice. Contacting SKLS through the site does not create a lawyer-client relationship. The firm should review all content, disclaimers, solicitation language, privacy terms, consent wording, storage, security and data-retention practices with its counsel before production use.
