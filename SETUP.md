# Deploying to Vercel

Follow these steps to deploy your Book Rankings site with the admin panel.

## Step 1: Push to GitHub

If your project isn't already on GitHub:

1. Create a new repository on GitHub
2. Push your code:
   ```bash
   git init
   git add .
   git commit -m "Initial commit with admin panel"
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```

## Step 2: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign up/log in with GitHub
2. Click **"Add New Project"**
3. Select your book rankings repository
4. Click **"Deploy"** (default settings are fine)

## Step 3: Add Vercel KV (Database)

1. In your Vercel dashboard, go to your project
2. Click the **"Storage"** tab
3. Click **"Create Database"** and select **"KV"**
4. Name it something like `book-rankings-kv`
5. Click **"Create"**
6. Vercel will automatically add the connection environment variables

## Step 4: Set Admin Password

1. In your Vercel project, go to **"Settings"** > **"Environment Variables"**
2. Add a new variable:
   - **Name:** `ADMIN_PASSWORD`
   - **Value:** `7habitslover`
3. Click **"Save"**

## Step 5: Redeploy

After adding environment variables:

1. Go to the **"Deployments"** tab
2. Click the **"..."** menu on the latest deployment
3. Click **"Redeploy"**

## Step 6: Initialize Your Books

After redeployment, run the setup to migrate your books:

1. Open your browser's developer console (F12)
2. Run this command (replace YOUR-SITE with your Vercel URL):
   ```javascript
   fetch('https://YOUR-SITE.vercel.app/api/admin/setup', {
     method: 'POST',
     headers: { 'X-Admin-Password': '7habitslover' }
   }).then(r => r.json()).then(console.log)
   ```
3. You should see: `{ success: true, message: "Books initialized successfully", count: 36 }`

## You're Done!

- **Main site:** `https://YOUR-SITE.vercel.app`
- **Admin panel:** `https://YOUR-SITE.vercel.app/admin`
- **Password:** `7habitslover`

---

## Adding Books (Your New Workflow)

1. Go to `your-site.vercel.app/admin` on your phone or computer
2. Enter your password
3. Fill in the book details (title, author, optional ISBN, rank)
4. Click "Add Book"
5. Done! The book appears on your site immediately.

## Changing Your Password

1. Go to Vercel dashboard > Your project > Settings > Environment Variables
2. Edit `ADMIN_PASSWORD` to your new password
3. Redeploy for changes to take effect

---

## Troubleshooting

**"Failed to fetch books" error:**
- Make sure Vercel KV is set up and connected
- Check that you ran the setup endpoint to initialize books

**"Unauthorized" error in admin:**
- Verify `ADMIN_PASSWORD` is set in Vercel environment variables
- Make sure you redeployed after adding the variable

**Books not showing after setup:**
- Clear your browser cache
- Check the browser console for errors
