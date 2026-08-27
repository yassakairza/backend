# D&D Character Sheet — Backend (Vercel + MongoDB)

A tiny serverless API that lets the character sheet create shareable links **and** optional user accounts. Deploys to **Vercel**, which does not require a credit card for this kind of project.

## How sharing works

- Clicking **"Save & Share"** in the app creates a document in MongoDB and returns two links:
  - **Edit link** (`?id=...&key=...`) — keep this private. Anyone with it can make changes.
  - **View link** (`?id=...`) — safe to send to your DM/party. Read-only.
- Every autosave while using the edit link pushes the latest data to MongoDB, so the view link always shows the current version.

## How accounts work

- Signing up / logging in (email + password) is entirely separate from sharing — you don't need an account to create or edit a character via the links above.
- What an account adds: a **"My Characters"** list, so you don't have to keep track of edit links yourself.
- While logged in, any character you Save & Share is automatically linked to your account. You can still hand out its view link to your DM/party as normal.
- Passwords are hashed with Node's built-in `scrypt` (never stored in plain text). Login sessions are signed tokens stored in an `HttpOnly` cookie — no separate session database needed.
- The classic edit-link/token system still works exactly as before, account or no account — accounts are additive, not a replacement.

## Files

```
api/sheets/index.js    -> POST /api/sheets        (create a new shared sheet)
api/sheets/[id].js     -> GET/PUT /api/sheets/:id  (view / update a sheet)
api/sheets/mine.js     -> GET /api/sheets/mine     (list your saved characters -- requires login)
api/auth/signup.js     -> POST /api/auth/signup    (create an account)
api/auth/login.js      -> POST /api/auth/login     (log in)
api/auth/logout.js     -> POST /api/auth/logout    (log out)
api/auth/me.js         -> GET /api/auth/me         (check who's currently logged in)
lib/db.js              -> MongoDB connection (cached for serverless reuse)
lib/cors.js            -> CORS headers (reflects request origin so login cookies work)
lib/auth.js            -> Password hashing + signed session tokens (no external auth library)
models/Sheet.js        -> The MongoDB document shape for a character sheet
models/User.js         -> The MongoDB document shape for an account
```

## 1. Push this folder to GitHub

1. Go to your GitHub repo → **Add file → Upload files**.
2. Upload everything in this folder (`api/`, `lib/`, `models/`, `package.json`, `.gitignore`, `.env.example`, this `README.md`). A subfolder like `backend/` is fine, or its own repo — either works.
3. **Never upload a real `.env` file** — it would contain your database password and session secret. `.gitignore` already excludes it if you use git commands; double-check if uploading by hand.
4. Commit.

## 2. Deploy to Vercel (no card required)

1. Go to **vercel.com** → sign up (easiest: "Continue with GitHub").
2. Click **Add New → Project**.
3. Pick the GitHub repo with this backend code.
4. If this backend is in a subfolder (e.g. `backend/`), set **Root Directory** to that folder in the project settings.
5. Framework Preset: leave as **Other** (Vercel auto-detects the `api/` folder as serverless functions — no build step needed for this project).
6. Before clicking Deploy, open **Environment Variables** and add:
   - **Key**: `MONGODB_URI`
   - **Value**: your MongoDB Atlas connection string, e.g.
     ```
     mongodb+srv://yourUsername:yourPassword@yourcluster.xxxxx.mongodb.net/dndcharsheet?retryWrites=true&w=majority
     ```
   - **Key**: `JWT_SECRET`
   - **Value**: a long random string used to sign login sessions. Generate one on your own computer with:
     ```
     node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
     ```
     Paste the output in as the value. **Don't skip this** — without a real secret, login sessions aren't secure.
7. Click **Deploy**. It usually finishes in under a minute.

## 3. Get your URL

Vercel gives you a URL like:
```
https://your-project-name.vercel.app
```

Test it works by visiting:
```
https://your-project-name.vercel.app/api/sheets
```
in your browser. Since that endpoint only accepts POST requests, visiting it directly (a GET request) should show:
```json
{"error":"Method not allowed"}
```
That response means it's working correctly — the server is live and responding.

## 4. Connect the frontend

Open `index.html` and find this line near the top of the `<script>` section:
```js
const BACKEND_URL = 'https://YOUR-BACKEND-URL.onrender.com/api/sheets';
```
Replace it with your real Vercel URL + `/api/sheets`:
```js
const BACKEND_URL = 'https://your-project-name.vercel.app/api/sheets';
```
Save, redeploy the frontend (same as before — Netlify/GitHub Pages/etc.), and both sharing and accounts are live — the account system reuses this same URL automatically.

## Notes

- No cold-start "spin down" concerns like some other free hosts — Vercel's free tier serverless functions respond quickly on each request.
- Never commit your real MongoDB connection string or `JWT_SECRET` anywhere public. Set them only through Vercel's Environment Variables panel.
- The edit link's `key` is a long random token — not guessable, but treat it like a password. Anyone who has it can edit that character.
- Login cookies use `Secure; SameSite=None`, which requires HTTPS — this works automatically on Vercel, but won't work if you try to test the backend over plain `http://`.

