# 🚀 Deployment Guide - Humanode Validator Monitor

## 📋 Prerequisites

1. **Vercel Account** - Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository** - Your code must be in a Git repository
3. **Vercel Blob Storage** - Will be auto-configured during deployment

## 🔧 Step-by-Step Deployment

### 1. Connect Repository to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your Git repository
3. Vercel will auto-detect Vite configuration

### 2. Configure Vercel Blob Storage

1. Go to your project dashboard on Vercel
2. Navigate to **Storage** tab
3. Click **Create Database** → Select **Blob**
4. Name it (e.g., "humanode-validator-storage")
5. Vercel will automatically inject these environment variables:
   - `BLOB_READ_WRITE_TOKEN`
   
**You don't need to manually set any env variables!**

### 3. Deploy

1. Click **Deploy**
2. Wait for build to complete (~2-3 minutes)
3. Your app will be live at `your-project.vercel.app`

### 4. Verify Cron Jobs

After deployment:

1. Go to **Settings** → **Cron Jobs**
2. You should see 2 cron jobs:
   - `/api/run-epoch` - Runs every 1 minute
   - `/api/run-uptime` - Runs every 1 minute

If not showing, check your `vercel.json` configuration.

## 📊 Initial Data Setup

After first deployment, your Blob Storage will be empty. The cron jobs will automatically:

1. Create `data/config/global_constants.json` on first run
2. Initialize phrase metadata when first epoch is detected
3. Start tracking validators automatically

**No manual data upload needed!** 🎉

## 🧪 Testing Cron Jobs Manually

You can test the endpoints manually:

```bash
# Test epoch monitoring
curl https://your-project.vercel.app/api/run-epoch

# Test uptime monitoring  
curl https://your-project.vercel.app/api/run-uptime
```

Expected response:
```json
{
  "success": true,
  "currentEpoch": 5678,
  "currentPhrase": 3,
  "timestamp": "2025-11-29T07:30:00.000Z"
}
```

## 📁 Blob Storage Structure

After cron jobs run, your Blob Storage will have:

```
data/
├── config/
│   └── global_constants.json
├── metadata/
│   ├── phrase_1_metadata.json
│   ├── phrase_2_metadata.json
│   └── ...
└── phrasedata/
    ├── api_helper_phrase_1_data.json
    ├── api_helper_phrase_2_data.json
    └── ...
```

## 🔍 Monitoring & Logs

### View Cron Logs

1. Go to **Deployments** tab
2. Click on latest deployment
3. View **Functions** logs
4. Filter by `/api/run-epoch` or `/api/run-uptime`

### Check Data in Blob Storage

1. Go to **Storage** tab
2. Click on your Blob store
3. Browse files in the web interface

## ⚙️ Configuration

### Adjusting Cron Frequency

Edit `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/run-epoch",
      "schedule": "*/5 * * * *"  // Every 5 minutes instead of 1
    }
  ]
}
```

Cron syntax: `minute hour day month dayOfWeek`

### Adjusting Constants

Constants are stored in `data/config/global_constants.json`:

```json
{
  "FIRST_EVER_PHRASE_START_EPOCH": 5450,
  "PHRASE_DURATION_EPOCHS": 84,
  "AVG_BLOCK_TIME_SECONDS": 6,
  "EPOCH_FAIL_THRESHOLD_SECONDS": 7200
}
```

To modify:
1. Go to Storage → Blob
2. Find `data/config/global_constants.json`
3. Edit values
4. Save

Changes take effect on next cron run.

## 🐛 Troubleshooting

### Cron Jobs Not Running

**Check 1:** Verify in `vercel.json`:
```json
{
  "crons": [...]
}
```

**Check 2:** Cron jobs only run on **production** deployments
- Make sure you've deployed to production, not just preview

**Check 3:** Check Function logs for errors

### No Data Appearing

**Possible causes:**
1. Cron hasn't run yet (wait 1-2 minutes after deployment)
2. RPC endpoint unreachable
3. Current epoch < `FIRST_EVER_PHRASE_START_EPOCH`

**Solution:**
- Check function logs in Vercel dashboard
- Manually trigger: `curl https://your-project.vercel.app/api/run-epoch`

### Blob Storage Errors

**Error:** `BLOB_READ_WRITE_TOKEN not found`

**Solution:**
1. Go to Storage tab
2. Make sure Blob store is created
3. Redeploy (environment variables are injected on deployment)

## 🔐 Security Notes

- Blob Storage is **private by default**
- Access requires `BLOB_READ_WRITE_TOKEN`
- Only your Vercel functions can read/write
- Public frontend reads via your API endpoints

## 📈 Scaling Considerations

### Current Limits
- **Cron Jobs**: Max 2 per day on Hobby plan
- **Function Duration**: 10s on Hobby, 60s on Pro
- **Blob Storage**: 10GB on Hobby plan

### If You Need More
- Upgrade to **Pro plan** for:
  - Unlimited cron jobs
  - 60s function timeout
  - 100GB Blob storage
  - Better performance

## 🔄 Updating Deployment

To deploy new changes:

```bash
git add .
git commit -m "Update monitoring logic"
git push origin main
```

Vercel will auto-deploy from GitHub.

## 📞 Support

- **Vercel Docs**: https://vercel.com/docs
- **Blob Storage Docs**: https://vercel.com/docs/storage/vercel-blob
- **Cron Jobs Docs**: https://vercel.com/docs/cron-jobs

---

**🎉 Your validator monitoring system is now fully deployed and running!**

Data will start populating within 1-2 minutes after deployment as cron jobs execute.
