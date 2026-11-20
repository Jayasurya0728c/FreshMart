# 🚀 Deploying FreshMart on Render

This guide walks you through hosting **FreshMart** on [Render](https://render.com) using the included `render.yaml` Blueprint or through the Render Dashboard.

---

## ⚡ Option 1: Automatic 1-Click Deployment (Recommended)

Render can automatically configure and deploy both the Django Backend and React Frontend using the included `render.yaml` blueprint.

1. Sign in to your [Render Dashboard](https://dashboard.render.com).
2. Click **New +** in the top navigation and select **Blueprint**.
3. Connect your GitHub account (if not already connected) and select the **`FreshMart`** repository.
4. Render will detect `render.yaml` and display the two services to be created:
   - **`freshmart-backend`** (Python Web Service)
   - **`freshmart-frontend`** (Static Site)
5. Click **Apply**.
6. Render will automatically build and deploy both services!

---

## 🛠️ Option 2: Manual Dashboard Setup

If you prefer to create the services individually on Render:

### Step 1: Deploy Backend Web Service

1. On the Render Dashboard, click **New +** → **Web Service**.
2. Select your **`FreshMart`** repository.
3. Configure the following fields:
   - **Name:** `freshmart-backend` (or your choice)
   - **Language / Runtime:** `Python 3`
   - **Root Directory:** `backend`
   - **Region:** Choose the region closest to you (e.g., *Singapore*, *Oregon*, *Frankfurt*)
   - **Branch:** `main`
   - **Build Command:** `./build.sh`
   - **Start Command:** `gunicorn core.wsgi:application`
   - **Plan:** Free
4. Add **Environment Variables**:
   | Key | Value | Notes |
   |---|---|---|
   | `PYTHON_VERSION` | `3.11.9` | |
   | `DEBUG` | `False` | |
   | `SECRET_KEY` | *(Click "Generate")* | Generates a secure key |
   | `ALLOWED_HOSTS` | `*` | Or specify your domain |
5. Click **Create Web Service**.
6. Once deployed, copy your backend URL (e.g., `https://freshmart-backend.onrender.com`).

---

### Step 2: Deploy Frontend Static Site

1. On the Render Dashboard, click **New +** → **Static Site**.
2. Select your **`FreshMart`** repository.
3. Configure the following fields:
   - **Name:** `freshmart-frontend`
   - **Root Directory:** `frontend`
   - **Branch:** `main`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
4. Add **Environment Variable**:
   | Key | Value |
   |---|---|
   | `VITE_API_URL` | `https://<your-backend-service-name>.onrender.com/api` |
   *(Replace with your actual backend URL from Step 1)*
5. Under **Redirects/Rewrites**:
   - **Source:** `/*`
   - **Destination:** `/index.html`
   - **Action:** `Rewrite`
6. Click **Create Static Site**.

---

## 🔑 Default Accounts (Pre-seeded)

Once deployed, the database is automatically seeded via `store/fixtures/initial_data.json` with all 22 grocery products, categories, and test accounts:

| Role | Username | Password | Notes |
|---|---|---|---|
| **Admin** | `admin` | `admin` | Full store & order management, promo banner editor |
| **Customer** | `john_shopper` | `password123` | Pre-configured test shopper account |

---

## 💡 Troubleshooting & Notes

- **Free Tier Cold Starts**: Render free-tier web services spin down after 15 minutes of inactivity. The initial request might take 30–50 seconds while the backend wakes up.
- **Media Uploads on Free Tier**: The free tier uses an ephemeral filesystem. Photos uploaded by customers or admin will reset on server restarts. For persistent file uploads in production, configure AWS S3 or Cloudinary.
