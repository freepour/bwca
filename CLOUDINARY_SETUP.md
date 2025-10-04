# Cloudinary Setup for BWCA Adventure 2025

## 🚀 Quick Setup (5 minutes)

### Step 1: Create Cloudinary Account
1. Go to [cloudinary.com](https://cloudinary.com)
2. Sign up for a free account
3. Verify your email

### Step 2: Get Your Credentials
1. In your Cloudinary dashboard, go to **Settings** → **Security**
2. Copy these values:
   - **Cloud Name** (e.g., `dxy123abc`)
   - **API Key** (e.g., `123456789012345`)
   - **API Secret** (e.g., `abcdefghijklmnopqrstuvwxyz123456`)

### Step 3: Create Upload Preset
1. Go to **Settings** → **Upload**
2. Click **Add Upload Preset**
3. Set these values:
   - **Preset Name**: `bwca_photos`
   - **Signing Mode**: `Unsigned` (for client-side uploads)
   - **Folder**: `bwca-adventure-2025`
   - **Access Mode**: `Public`
4. Click **Save**

### Step 4: Add Environment Variables

#### For Local Development:
1. Copy `env.example` to `.env.local`
2. Add your Cloudinary credentials:
```env
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

#### For Vercel Deployment:
1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Add these variables:
   - `CLOUDINARY_CLOUD_NAME` = your cloud name
   - `CLOUDINARY_API_KEY` = your API key
   - `CLOUDINARY_API_SECRET` = your API secret

### Step 5: Deploy
1. Push your changes to GitHub
2. Vercel will automatically redeploy
3. Your photos will now be stored in Cloudinary!

## 📸 What This Enables:

- ✅ **Real photo storage** (not just browser previews)
- ✅ **HEIC conversion** handled by Cloudinary
- ✅ **Automatic optimization** for web display
- ✅ **CDN delivery** for fast loading worldwide
- ✅ **Secure URLs** for your photos
- ✅ **Free tier** includes 25GB storage + 25GB bandwidth

## 🔧 Troubleshooting:

**If uploads fail:**
1. Check your environment variables are set correctly
2. Verify the upload preset name is `bwca_photos`
3. Check the Vercel function logs for errors

**If images don't display:**
1. Check the Cloudinary dashboard to see if images uploaded
2. Verify the image URLs in the browser console
3. Check CORS settings in Cloudinary (should be fine with default settings)

## 💰 Pricing:

- **Free Tier**: 25GB storage, 25GB bandwidth/month
- **Pro Tier**: $89/month for 100GB storage, 100GB bandwidth
- **Pay-as-you-go**: $0.10/GB for additional storage

For a small group sharing trip photos, the free tier should be plenty!
