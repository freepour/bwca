# BWCA Photo Share

A beautiful, modern photo-sharing platform for friends to share memories from their BWCA trip.

## Features

- 📸 **Easy Photo Upload** - Drag and drop or click to upload photos
- 🖼️ **Beautiful Gallery** - Responsive grid layout with smooth animations
- 👥 **Friend Access** - Private sharing with your group
- ❤️ **Like & Share** - Interact with photos from your friends
- 📱 **Mobile Friendly** - Works perfectly on all devices
- 🎨 **Modern UI** - Clean, intuitive design with Tailwind CSS
- 📅 **Timeline Organization** - Photos organized chronologically by date
- 📱 **HEIC Support** - Full support for iPhone HEIC photos

## Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Smooth animations
- **React Dropzone** - File upload handling
- **Lucide React** - Beautiful icons

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd bwca
```

2. Install dependencies:
```bash
npm install
```

3. Copy the environment file:
```bash
cp env.example .env.local
```

4. Update the environment variables in `.env.local` with your configuration.

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

Create a `.env.local` file with the following variables:

```env
# Database (optional for now)
DATABASE_URL="postgresql://username:password@localhost:5432/bwca_photos"

# NextAuth (for future authentication)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Cloudinary (for photo storage)
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add your environment variables in Vercel dashboard
4. Deploy!

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## Project Structure

```
├── app/                 # Next.js App Router
│   ├── globals.css     # Global styles
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Home page
├── components/         # React components
│   ├── PhotoUpload.tsx # Upload interface
│   └── PhotoGallery.tsx # Gallery display
├── public/            # Static assets
└── README.md          # This file
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - feel free to use this project for your own photo-sharing needs!

## Support

If you have any questions or need help, please open an issue on GitHub.