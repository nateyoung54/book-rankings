# Deploying to Vercel

Follow these steps to deploy your Book Rankings site with the admin panel.

## Step 1: Create a GitHub Personal Access Token

1. Go to [github.com/settings/tokens](https://github.com/settings/tokens?type=beta)
2. Click **"Generate new token"** > **"Fine-grained token"**
3. Give it a name like `book-rankings-admin`
4. Set expiration (recommend: 1 year)
5. Under **"Repository access"**, select **"Only select repositories"**
6. Choose your **book-rankings** repository
7. Under **"Permissions"** > **"Repository permissions"**:
   - Set **"Contents"** to **"Read and write"**
8. Click **"Generate token"**
9. **Copy the token** (you won't see it again!)

## Step 2: Add Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Click **"Settings"** > **"Environment Variables"**
3. Add these two variables:

   | Name | Value |
   |------|-------|
   | `ADMIN_PASSWORD` | `7habitslover` |
   | `GITHUB_TOKEN` | (paste your token from Step 1) |

4. Click **"Save"**

## Step 3: Redeploy

1. Go to **"Deployments"** tab
2. Click **"..."** on the latest deployment
3. Click **"Redeploy"**

## You're Done!

- **Main site:** `https://book-rankings.vercel.app`
- **Admin panel:** `https://book-rankings.vercel.app/admin`
- **Password:** `7habitslover`

---

## Adding Books

1. Go to `book-rankings.vercel.app/admin` on your phone or computer
2. Enter your password
3. Fill in: Title, Author, ISBN (optional), Rank
4. Click **"Add Book"**
5. Wait ~30 seconds for your site to rebuild
6. Your new book appears!

---

## Changing Your Password

1. Go to Vercel > Settings > Environment Variables
2. Update `ADMIN_PASSWORD`
3. Redeploy

## Troubleshooting

**"GitHub token not configured" error:**
- Make sure `GITHUB_TOKEN` is set in Vercel environment variables
- Redeploy after adding it

**"Failed to update books.json" error:**
- Your GitHub token may have expired
- Create a new token and update it in Vercel
