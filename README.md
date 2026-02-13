# Personal site

Next.js app for my personal website, including:

- **About page** with optional profile photo (stored in **Vercel Blob**, URL stored in **Vercel KV**).
- **Blog module** with posts (text + emoji + images) stored in **Vercel KV**.
- **Admin-only** upload/edit after logging in with a simple password (cookie-based session).

## Local development

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Admin

- **Login**: `http://localhost:3000/admin/login`
- **Admin home**: `http://localhost:3000/admin`

From the admin pages you can:

- Upload and set the About photo.
- Create/edit/delete Blog posts (with multiple images).

## Environment variables

Create `.env.local` in the project root and set:

- **ADMIN_SECRET**: admin password used for login and API auth
- **BLOB_READ_WRITE_TOKEN**: Vercel Blob read/write token (needed for local uploads)
- **KV_REST_API_URL**: Vercel KV REST API URL
- **KV_REST_API_TOKEN**: Vercel KV REST API token

On Vercel, enable **Storage → Blob** and **Storage → KV** for the project and add the generated env vars in the project settings.