# Technician Recruitment Form — Frontend notes

This folder contains a client-side multi-step technician recruitment form used by the Next.js app.

Files
- `RegistrationForm.tsx` — multi-step UI (steps 1–4), client validation, and fetch calls.
- `api.ts` — small helper that centralizes calls to the backend endpoints.

Environment
- `NEXT_PUBLIC_API_BASE_URL` should point to the base path where your technician router is mounted. Example:

  - If your Express router is mounted at `/technicians` on `http://localhost:4000`, set:

  ```bash
  export NEXT_PUBLIC_API_BASE_URL="http://localhost:4000/technicians"
  ```

Photos
- The form currently converts selected image files to data-URLs (base64) and sends them in the `photos` array to the backend (`POST /:id/upload-work-photos`).
- For production, use a pre-signed S3 upload flow: upload files from the client to S3, then send the returned S3 URLs to the backend.

Assumptions
- Create endpoint returns the created record inside `data` with `_id` or `id`. If your backend uses a different shape, update `RegistrationForm.tsx` parsing or the `api.ts` wrapper.
- Authentication: the helper uses `credentials: include`. Remove or change if not needed.

How to run
1. Set `NEXT_PUBLIC_API_BASE_URL`.
2. Start Next.js app:

```bash
# zsh
export NEXT_PUBLIC_API_BASE_URL="http://localhost:4000/technicians"
npm run dev
```

If you want, I can: add S3 presigned flow, integrate `react-hook-form` + `zod`, or replace base64 photo uploads with streaming/file uploads. Tell me which you'd prefer next.

Dependencies
- This form now uses `react-hook-form`. Install it in your project:

```bash
npm install react-hook-form
```

- Axios is used by the API helper. Install it as well:

```bash
npm install axios
```

Environment: credentials toggle
- By default the frontend will NOT send credentials (cookies) with requests so that CORS can be unrestricted. If you need credentials (cookies/session), set this in your environment before starting Next:

```bash
# zsh
export NEXT_PUBLIC_API_WITH_CREDENTIALS=true
```

If you set that, ensure your backend CORS is configured to return the specific origin and `Access-Control-Allow-Credentials: true`.

S3 upload flow
- The frontend now uploads files to the backend S3 endpoint before sending the array of file URLs to the technician document endpoint. The helper used is `uploadSingleFileToS3(file: File)` which POSTs to `/api/s3/uploadSingleFile` and expects the backend to return the uploaded file URL in the response (common keys: `url`, `location`).

Backend: ensure you have a route mounted at `/api/s3/uploadSingleFile` that accepts `multipart/form-data` with field `file` and returns the uploaded file URL.

