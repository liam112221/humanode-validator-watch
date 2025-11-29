# Humanode Validator Monitor - Project Structure

## 📁 Directory Structure

```
humanode-validator/
│
├── api/                                # Vercel Serverless API endpoints
│   ├── run-epoch.ts                    # ✅ Epoch monitoring (logic akan diisi)
│   ├── run-uptime.ts                   # ✅ Uptime monitoring (logic akan diisi)
│   ├── metadata.ts                     # ✅ Get phrase metadata
│   ├── phrasedata.ts                   # ✅ Get phrase data
│   ├── validator.ts                    # ✅ Get validator data
│   └── data-latest.ts                  # ✅ Get latest data summary
│
├── storage/                            # Vercel Blob Storage helpers
│   └── blob.ts                         # ✅ readJSON & writeJSON functions
│
├── src/                                # React Frontend
│   ├── pages/
│   │   ├── Dashboard.tsx               # ✅ Main dashboard (placeholder)
│   │   ├── ValidatorDetail.tsx         # ✅ Validator detail page (placeholder)
│   │   ├── Recap.tsx                   # ✅ Cycle recap page (placeholder)
│   │   └── NotFound.tsx                # ✅ 404 page
│   ├── components/                     # UI Components
│   │   └── ui/                         # shadcn/ui components
│   ├── utils/
│   │   ├── time.ts                     # ✅ Time formatting utilities
│   │   ├── phrase.ts                   # ✅ Phrase calculation utilities
│   │   └── calc.ts                     # ✅ Statistics calculation utilities
│   ├── App.tsx                         # ✅ Main app with routing
│   └── main.tsx                        # ✅ Entry point
│
├── data/                               # Data files (Vercel Blob Storage)
│   ├── config/
│   │   └── global_constants.json       # ✅ Global configuration
│   ├── metadata/
│   │   └── phrase_0_metadata.json      # ✅ Phrase metadata (dummy)
│   └── phrasedata/
│       └── api_helper_phrase_0_data.json  # ✅ Phrase data (dummy)
│
├── vercel.json                         # ✅ Vercel config + cron jobs
└── PROJECT_STRUCTURE.md                # ✅ This file
```

## 🎯 Status

### ✅ Completed
- Project structure setup
- Vercel Blob Storage helper (`storage/blob.ts`)
- All API endpoint files created (logic belum diisi)
- Basic React pages (Dashboard, ValidatorDetail, Recap)
- Utility functions (time, phrase, calc)
- Dummy data files
- Vercel cron configuration
- Routing setup

### ⏳ Next Steps (Tunggu Instruksi)
1. **Integrasikan logic dari `server.js`** ke:
   - `api/run-epoch.ts` → Logic epoch monitoring
   - `api/run-uptime.ts` → Logic uptime monitoring

2. **Generate UI lengkap** berdasarkan HTML yang sudah ada:
   - `dashboard.ejs` → `Dashboard.tsx`
   - `validator_detail.ejs` → `ValidatorDetail.tsx`
   - `recap.ejs` → `Recap.tsx`

## 🔧 Tech Stack

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Vercel Serverless Functions
- **Storage**: Vercel Blob Storage
- **Hosting**: Vercel
- **Cron**: Vercel Cron Jobs (setiap 1 menit)

## 📝 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/run-epoch` | GET/POST | Cron - Monitor epoch & update metadata |
| `/api/run-uptime` | GET/POST | Cron - Monitor validator uptime |
| `/api/metadata?phrase=X` | GET | Get phrase metadata |
| `/api/phrasedata?phrase=X` | GET | Get phrase data |
| `/api/validator?phrase=X&address=Y` | GET | Get validator data |
| `/api/data-latest` | GET | Get latest data summary |

## 🚀 Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## 📦 Vercel Deployment

1. Connect repository to Vercel
2. Vercel akan auto-detect Vite config
3. Cron jobs akan otomatis berjalan setelah deploy
4. Setup Vercel Blob Storage:
   - Go to Storage tab
   - Create Blob Store
   - Vercel akan inject env variables otomatis

## ⚙️ Cron Jobs Configuration

```json
{
  "crons": [
    { "path": "/api/run-epoch", "schedule": "*/1 * * * *" },
    { "path": "/api/run-uptime", "schedule": "*/1 * * * *" }
  ]
}
```

Both cron jobs run **every 1 minute**.

## 📊 Data Structure

### Global Constants
```json
{
  "FIRST_EVER_PHRASE_START_EPOCH": 5450,
  "PHRASE_DURATION_EPOCHS": 84,
  "AVG_BLOCK_TIME_SECONDS": 6,
  "EPOCH_FAIL_THRESHOLD_SECONDS": 7200
}
```

### Phrase Metadata
```json
{
  "phraseNumber": 0,
  "phraseStartEpoch": 5450,
  "phraseEndEpoch": null,
  "phraseStartTime": null,
  "epochs": {}
}
```

### Phrase Data (API Helper)
```json
{
  "validator_address": {
    "status": "PASS|FAIL|BERJALAN",
    // ... other data
  }
}
```

## 🔒 Important Notes

1. **Jangan ubah algoritma** dari logic original
2. **Jangan ubah struktur JSON** input/output
3. **Hanya adaptasi** filesystem → Blob Storage:
   - `fs.readFile` → `readJSON(path)`
   - `fs.writeFile` → `writeJSON(path, data)`
4. Path harus sama persis dengan sistem lama

## 📞 Next Action

**SIAP UNTUK INTEGRASI LOGIC!**

Kirimkan instruksi untuk:
1. Extract & insert logic dari `server.js`
2. Generate UI lengkap dari file `.ejs`
