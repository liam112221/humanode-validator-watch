# 🧪 API Testing Guide

## Base URL
```
https://your-project.vercel.app
```

Replace `your-project` with your actual Vercel project name.

## 🔄 Cron Endpoints (Auto-triggered)

### 1. Epoch Monitoring
**Endpoint:** `GET /api/run-epoch`

**Purpose:** 
- Detects epoch changes
- Updates phrase metadata
- Finalizes epoch status (PASS/FAIL)

**Manual Test:**
```bash
curl https://your-project.vercel.app/api/run-epoch
```

**Expected Response:**
```json
{
  "success": true,
  "currentEpoch": 5678,
  "currentPhrase": 3,
  "timestamp": "2025-11-29T07:30:00.000Z"
}
```

**Runs:** Every 1 minute (automated)

---

### 2. Uptime Monitoring
**Endpoint:** `GET /api/run-uptime`

**Purpose:**
- Checks validator status (active/inactive)
- Tracks downtime duration
- Updates validator monitoring data

**Manual Test:**
```bash
curl https://your-project.vercel.app/api/run-uptime
```

**Expected Response:**
```json
{
  "success": true,
  "currentEpoch": 5678,
  "currentPhrase": 3,
  "activeValidatorsCount": 156,
  "dataChanged": true,
  "timestamp": "2025-11-29T07:30:00.000Z"
}
```

**Runs:** Every 1 minute (automated)

---

## 📊 Data Reading Endpoints

### 3. Get Phrase Metadata
**Endpoint:** `GET /api/metadata?phrase={phraseNumber}`

**Purpose:** Get global metadata for a specific phrase

**Example:**
```bash
curl "https://your-project.vercel.app/api/metadata?phrase=1"
```

**Response:**
```json
{
  "phraseNumber": 1,
  "phraseStartEpoch": 5450,
  "phraseEndEpoch": 5533,
  "phraseStartTime": "2025-01-15T08:00:00.000Z",
  "epochs": {
    "5450": {
      "startTime": "2025-01-15T08:00:00.000Z",
      "firstBlock": 123456,
      "sessionLength": 2400
    },
    "5451": { ... }
  }
}
```

---

### 4. Get Phrase Data (All Validators)
**Endpoint:** `GET /api/phrasedata?phrase={phraseNumber}`

**Purpose:** Get all validator data for a specific phrase

**Example:**
```bash
curl "https://your-project.vercel.app/api/phrasedata?phrase=1"
```

**Response:**
```json
{
  "cg1111111111111111111111111111111111111": {
    "epochs": {
      "5450": {
        "status": "PASS_API_HELPER",
        "totalApiHelperInactiveSeconds": 120,
        "firstMonitoredTimestamp": "2025-01-15T08:00:00.000Z"
      },
      "5451": {
        "status": "FAIL_API_HELPER",
        "totalApiHelperInactiveSeconds": 7800
      }
    }
  },
  "cg222222222222222222222222222222222222": { ... }
}
```

---

### 5. Get Validator Data
**Endpoint:** `GET /api/validator?phrase={phraseNumber}&address={validatorAddress}`

**Purpose:** Get specific validator data for a phrase

**Example:**
```bash
curl "https://your-project.vercel.app/api/validator?phrase=1&address=cg1111111111111111111111111111111111111"
```

**Response:**
```json
{
  "epochs": {
    "5450": {
      "status": "PASS_API_HELPER",
      "totalApiHelperInactiveSeconds": 120,
      "firstMonitoredTimestamp": "2025-01-15T08:00:00.000Z"
    },
    "5451": { ... }
  }
}
```

---

### 6. Get Latest Data Summary
**Endpoint:** `GET /api/data-latest`

**Purpose:** Get current phrase summary with metadata and validator data

**Example:**
```bash
curl https://your-project.vercel.app/api/data-latest
```

**Response:**
```json
{
  "currentPhrase": 2,
  "constants": {
    "FIRST_EVER_PHRASE_START_EPOCH": 5450,
    "PHRASE_DURATION_EPOCHS": 84,
    "AVG_BLOCK_TIME_SECONDS": 6,
    "EPOCH_FAIL_THRESHOLD_SECONDS": 7200
  },
  "metadata": {
    "phraseNumber": 2,
    "phraseStartEpoch": 5534,
    "phraseEndEpoch": 5617,
    "phraseStartTime": "2025-02-15T08:00:00.000Z",
    "epochs": { ... }
  },
  "phrasedata": {
    "cg1111111111111111111111111111111111111": { ... }
  },
  "timestamp": "2025-11-29T07:30:00.000Z"
}
```

---

## 🔍 Testing Scenarios

### Scenario 1: Fresh Deployment
**Goal:** Verify cron jobs initialize data

**Steps:**
1. Deploy to Vercel
2. Wait 2 minutes
3. Call `/api/data-latest`
4. Verify response has current phrase and epoch data

**Expected:** 
- `currentPhrase` >= 1
- `metadata.epochs` has entries
- Some validators in `phrasedata`

---

### Scenario 2: Epoch Transition
**Goal:** Verify epoch finalization

**Steps:**
1. Note current epoch from `/api/data-latest`
2. Wait for epoch change (~4 hours)
3. Call `/api/run-epoch` manually (or wait for cron)
4. Check metadata for new epoch
5. Check previous epoch validators have PASS/FAIL status

**Expected:**
- New epoch appears in metadata
- Previous epoch validators no longer have "BERJALAN" status
- Status is "PASS_API_HELPER" or "FAIL_API_HELPER"

---

### Scenario 3: Validator Downtime
**Goal:** Verify downtime tracking

**Steps:**
1. Pick a validator that's currently active
2. Wait for validator to go offline (or simulate)
3. Check validator data after a few minutes
4. Verify `totalApiHelperInactiveSeconds` increases

**Expected:**
- When validator inactive > 2 hours in epoch → `FAIL_API_HELPER`
- When validator inactive < 2 hours → `PASS_API_HELPER`

---

## 📈 Response Status Codes

| Code | Meaning | Reason |
|------|---------|--------|
| 200 | Success | Request processed successfully |
| 400 | Bad Request | Missing required parameters |
| 404 | Not Found | Phrase or validator data doesn't exist |
| 500 | Server Error | Internal error, check logs |

---

## 🐛 Debugging Tips

### Empty Response from `/api/metadata?phrase=X`
**Cause:** Phrase hasn't started yet or data not initialized

**Solution:** 
- Check current epoch: call `/api/run-epoch`
- Verify phrase number is valid

### `dataChanged: false` in `/api/run-uptime`
**Cause:** No validator state changes since last check

**Solution:** 
- This is normal behavior
- Data only saves when validators change status

### 500 Error on Cron Endpoints
**Cause:** Blob Storage not configured or RPC unreachable

**Solution:**
1. Verify Blob Storage is created in Vercel
2. Check function logs for specific error
3. Test RPC manually: `curl https://explorer-rpc-http.mainnet.stages.humanode.io`

---

## 🔐 Authentication

All endpoints are **public** and don't require authentication.

However, write operations to Blob Storage require `BLOB_READ_WRITE_TOKEN` which is:
- Automatically injected by Vercel
- Only available to your serverless functions
- Not exposed to frontend or external calls

---

## 📊 Rate Limits

| Endpoint | Limit | Type |
|----------|-------|------|
| Cron endpoints | Unlimited | Automated |
| Data reading endpoints | Vercel default | Per deployment |
| Manual cron calls | No limit | Manual testing |

**Note:** Cron jobs are automatically managed by Vercel and don't count toward function invocation limits.

---

## 🧪 Postman Collection

You can import these endpoints to Postman:

```json
{
  "info": {
    "name": "Humanode Validator Monitor API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Run Epoch",
      "request": {
        "method": "GET",
        "url": "{{base_url}}/api/run-epoch"
      }
    },
    {
      "name": "Run Uptime",
      "request": {
        "method": "GET",
        "url": "{{base_url}}/api/run-uptime"
      }
    },
    {
      "name": "Get Metadata",
      "request": {
        "method": "GET",
        "url": "{{base_url}}/api/metadata?phrase=1"
      }
    },
    {
      "name": "Get Latest Data",
      "request": {
        "method": "GET",
        "url": "{{base_url}}/api/data-latest"
      }
    }
  ],
  "variable": [
    {
      "key": "base_url",
      "value": "https://your-project.vercel.app"
    }
  ]
}
```

Save this as `humanode-api.postman_collection.json` and import to Postman.

---

**Happy Testing! 🚀**
