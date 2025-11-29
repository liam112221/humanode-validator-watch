# Humanode Validator Monitor

Aplikasi monitoring untuk Humanode Validator dengan tracking epoch, uptime, dan performa validator secara real-time.

## 🎯 Project Info

**URL**: https://lovable.dev/projects/2a1971bf-4313-4719-b708-6cf463306cf2

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/2a1971bf-4313-4719-b708-6cf463306cf2) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## 🛠️ What technologies are used for this project?

This project is built with:

- **Frontend**: React + TypeScript + Vite
- **UI**: shadcn-ui + Tailwind CSS
- **Backend**: Vercel Serverless Functions
- **Storage**: Vercel Blob Storage
- **Cron Jobs**: Vercel Cron (runs every 1 minute)

## 📁 Project Structure

See [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) for detailed information about the project structure.

## 🚀 Features

- **Real-time Epoch Monitoring**: Track current epoch and phrase progression
- **Validator Uptime Tracking**: Monitor validator status (PASS/FAIL/BERJALAN)
- **Cycle Recap**: Weekly and phrase-based statistics
- **Automated Monitoring**: Cron jobs run every minute to update data
- **Responsive Dashboard**: Clean UI for monitoring all validators

## 🚀 How can I deploy this project?

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

**Quick Deploy:**
1. Push to GitHub
2. Import to Vercel
3. Create Blob Storage
4. Deploy!

Cron jobs will start automatically.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
