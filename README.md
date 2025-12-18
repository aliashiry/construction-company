# Construction Company — MEP Project

A modern Angular single-page application for managing construction projects (MEP). 
Core features include authentication, project file upload, file processing results, project history, user profile and a services catalogue.

Repository: https://github.com/aliashiry/construction-company

---

## Table of Contents
- Project overview
- Features
- Tech stack
- Prerequisites
- Quick start (development)
- Configuration
- Building & deployment
- Testing & linting
- Project structure & important files
- Routing / Pages
- Troubleshooting
- Contributing
- License & Contact

---

## Project overview
This Angular application implements client-side pages and components for users to register/login, upload project files, view processing results and history, and manage profiles. The project uses lazy-loaded standalone components (see `src/app/app.routes.ts`).

---

## Features
- User authentication (login / register)
- File upload center with progress and result pages
- Project history and per-project view
- Profile management
- Services listing and "work on" flow
- Lazy-loaded routes for faster initial load

---

## Tech stack
- Angular (standalone components)
- TypeScript
- Node.js / npm
- Angular CLI (optional for local dev)
- Visual Studio2022 for IDE (optional)

---

## Prerequisites
- Node.js LTS (v16+ recommended)
- npm (v8+)
- Git
- (Optional) Angular CLI: `npm i -g @angular/cli`

---

## Quick start (development)
1. Clone the repo
 - `git clone https://github.com/aliashiry/construction-company.git`
 - `cd construction-company`
2. Install dependencies
 - `npm install`
3. Configure environment (see Configuration below)
4. Run dev server
 - `npm start` or `ng serve --open`

The app will be available at `http://localhost:4200` by default.

---

## Configuration
Edit `src/environments/environment.ts` (and `environment.prod.ts`) to set runtime values such as API base URL, keys, and toggles.

Example:

```ts
export const environment = {
 production: false,
 apiUrl: 'https://api.yourbackend.com',
 // add other keys here
};
```

If your backend requires tokens/credentials, either store them in a secure secrets store or pass at build/deploy time.

---

## Building & deployment
- Development build: `ng build`
- Production build: `ng build --configuration production` (outputs to `dist/`)
- Deploy the contents of `dist/<project-name>` to any static host (Netlify, S3, Azure Static Web Apps) or integrate with a server-side host (IIS, .NET) as required.

If you host alongside a .NET backend, copy `dist` into the server's static files folder or configure the server to serve the built assets.

---

## Testing & linting
- Run unit tests: `ng test`
- End-to-end tests (if configured): `ng e2e`
- Lint: `ng lint` or `npm run lint` (depends on scripts in `package.json`)

---

## Project structure & important files
- `src/app/app.routes.ts` — application routes (lazy-loaded components)
- `src/app/components/` — UI components (upload, loading, file-result, history, work-on, etc.)
- `src/app/pages/` — top-level pages (login, register, profile, list, services, notfound)
- `src/app/services/` — services (e.g., `upload.service.ts`)
- `src/environments/` — environment configuration
- `package.json` — npm scripts (start/build/test)

---

## Routing / Pages
Routes defined (see `src/app/app.routes.ts`):
- `/list` — List page
- `/login` — Login page
- `/profile` — Profile page
- `/services` — Services page
- `/register` — Register page
- `/upload` — Upload file component
- `/new-project` — redirects to `/upload`
- `/file-result` — File processing result
- `/history` — Project/file history
- `/error` — Not found / error page
- `/workon` — Work-on component

---

## Troubleshooting
- If a lazy-loaded component fails to load, ensure the import path and exported class name match (case-sensitive).
- If the app does not start: delete `node_modules` and run `npm install` again.
- Check the browser console and network tab for API errors — ensure `apiUrl` is correctly configured.

---

## Contributing
1. Create an issue describing the change.
2. Create a feature branch: `git checkout -b feat/name`
3. Implement and test locally.
4. Open a PR with a clear description.

Follow standard commit and PR hygiene.

---

## License & Contact
Add a LICENSE file if needed (MIT recommended for open-source). 
For questions, open an issue in the repository.
