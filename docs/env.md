# Environment Variables

For upload, blog, and admin features you need the following environment variables.

## Local development (`.env.local`)

Create a file `.env.local` in the project root (same folder as `package.json`) with:

```env
# Admin: password for /admin/login (choose a strong password)
ADMIN_SECRET=your-secret-password

# Vercel Blob (images)
# Get from: Vercel Dashboard → your project → Storage → Blob → Create → copy env vars
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxx

# Vercel KV (about photo URL, blog posts)
# Get from: Vercel Dashboard → your project → Storage → KV → Create → copy env vars
KV_REST_API_URL=https://xxxxx.kv.vercel-storage.com
KV_REST_API_TOKEN=xxxxx
```

## Vercel (production)

1. **Vercel Dashboard** → your project → **Settings** → **Environment Variables**.
2. Add the same variable names and values. For Blob and KV, create the stores first:
   - **Storage** → **Blob** → Create Database → connect to project (env vars are added automatically or copy them).
   - **Storage** → **KV** → Create Database → connect to project (env vars are added automatically or copy them).
3. Add `ADMIN_SECRET` manually (same value you use locally or a different one for production).

## Summary

| Variable | Required | Description |
|----------|----------|-------------|
| `ADMIN_SECRET` | Yes (for admin) | Password for admin login; used to protect upload and edit APIs. |
| `BLOB_READ_WRITE_TOKEN` | Yes (for upload) | Vercel Blob token for image uploads. |
| `KV_REST_API_URL` | Yes (for about/blog) | Vercel KV REST API URL. |
| `KV_REST_API_TOKEN` | Yes (for about/blog) | Vercel KV REST API token. |

Without these, the site still runs; only admin login, About photo upload, and Blog post management will be unavailable.
