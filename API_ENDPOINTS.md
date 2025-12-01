# API Endpoints Documentation

Semua endpoint API mengembalikan data dalam format JSON yang bisa diakses oleh mobile apps atau aplikasi lain.

## Base URL
```
Production: https://validator.crxanode.me
Development: http://localhost:5173
```

---

## 📊 Dashboard API

### GET `/api/dashboard`

Mengembalikan data dashboard dengan semua validator dan statistik mereka.

**Response:**
```json
{
  "currentPhrase": 0,
  "phraseStartEpoch": 5450,
  "phraseEndEpoch": 5533,
  "phraseStartTime": "2025-01-01T00:00:00Z",
  "constants": {
    "FIRST_EVER_PHRASE_START_EPOCH": 5450,
    "PHRASE_DURATION_EPOCHS": 84,
    "AVG_BLOCK_TIME_SECONDS": 6,
    "EPOCH_FAIL_THRESHOLD_SECONDS": 7200
  },
  "validators": [
    {
      "address": "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
      "passCount": 50,
      "failCount": 2,
      "runningCount": 10,
      "totalEpochs": 62,
      "lastApiHelperState": "active",
      "lastApiHelperStateChangeTimestamp": "2025-01-15T10:30:00Z"
    }
  ],
  "totalValidators": 100,
  "timestamp": "2025-01-15T12:00:00Z"
}
```

---

## 👤 Validator API

### GET `/api/validator/:address`

Mengembalikan data lengkap untuk satu validator spesifik di semua phrases.

**Path Parameters:**
- `address` (string, required): Alamat validator

**Example:**
```
GET /api/validator/5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY
```

**Response:**
```json
{
  "validatorAddress": "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
  "errorMessage": null,
  "latestPhraseNumber": 0,
  "latestPhraseStartEpoch": 5450,
  "latestPhraseEndEpoch": 5533,
  "actualPhraseStartTimeForDisplay": "2025-01-01T00:00:00Z",
  "constants": { /* ... */ },
  "phraseData": {
    "lastApiHelperState": "active",
    "lastApiHelperStateChangeTimestamp": "2025-01-15T10:30:00Z",
    "epochs": {
      "5450": {
        "status": "PASS_API_HELPER",
        "totalApiHelperInactiveSeconds": 0,
        "firstMonitoredTimestamp": "2025-01-01T00:05:00Z"
      }
    }
  },
  "allEpochsInLatestPhrase": [ /* ... */ ],
  "phraseHistory": [
    {
      "phraseNumber": 0,
      "startEpoch": 5450,
      "endEpoch": 5533,
      "passCount": 50,
      "failCount": 2,
      "otherCount": 10,
      "isCurrentPhrase": true,
      "hasDataForThisPhrase": true
    }
  ],
  "allPhrasesData": {
    "phrase_0": { /* ... */ }
  },
  "timestamp": "2025-01-15T12:00:00Z"
}
```

---

## 📈 Recap API

### GET `/api/recap`

Mengembalikan rekap siklus dengan statistik per minggu untuk semua phrases.

**Response:**
```json
{
  "completedCycles": [
    {
      "phraseNumber": 0,
      "week1FullPass": 85,
      "week2FullPass": 82,
      "totalValidators": 100
    }
  ],
  "ongoingCycle": {
    "phraseNumber": 1,
    "week1": {
      "zeroFails": 90,
      "withFails": 10
    },
    "week2": {
      "zeroFails": 85,
      "withFails": 15
    },
    "totalValidators": 100
  },
  "constants": { /* ... */ },
  "timestamp": "2025-01-15T12:00:00Z"
}
```

---

## 🗂️ Metadata API

### GET `/api/metadata?phrase=:phrase`

Mengembalikan metadata epoch untuk phrase tertentu.

**Query Parameters:**
- `phrase` (number, required): Nomor phrase

**Example:**
```
GET /api/metadata?phrase=0
```

**Response:**
```json
{
  "phraseNumber": 0,
  "phraseStartEpoch": 5450,
  "phraseEndEpoch": 5533,
  "phraseStartTime": "2025-01-01T00:00:00Z",
  "epochs": {
    "5450": {
      "startTime": "2025-01-01T00:00:00Z",
      "firstBlock": 12345678,
      "sessionLength": 2400
    }
  }
}
```

---

## 📝 Phrasedata API

### GET `/api/phrasedata?phrase=:phrase`

Mengembalikan data uptime API Helper untuk phrase tertentu (semua validator).

**Query Parameters:**
- `phrase` (number, required): Nomor phrase

**Example:**
```
GET /api/phrasedata?phrase=0
```

**Response:**
```json
{
  "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY": {
    "lastApiHelperState": "active",
    "lastApiHelperStateChangeTimestamp": "2025-01-15T10:30:00Z",
    "epochs": {
      "5450": {
        "status": "PASS_API_HELPER",
        "totalApiHelperInactiveSeconds": 0
      }
    }
  }
}
```

---

## 📋 Data Latest API

### GET `/api/data-latest`

Mengembalikan summary data terbaru termasuk phrase saat ini.

**Response:**
```json
{
  "currentPhrase": 0,
  "constants": { /* ... */ },
  "metadata": { /* ... */ },
  "phrasedata": { /* ... */ },
  "timestamp": "2025-01-15T12:00:00Z"
}
```

---

## 🔄 Cron Endpoints (Internal Only)

Endpoint ini dipanggil otomatis oleh Vercel Cron setiap 1 menit. Tidak untuk diakses public.

### POST `/api/run-epoch`
Menjalankan logic monitoring epoch dan phrase.

### POST `/api/run-uptime`
Menjalankan logic monitoring API Helper uptime.

---

## Error Responses

Semua endpoint mengembalikan error dalam format:

```json
{
  "error": "Error message description"
}
```

**HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request (missing parameters)
- `404` - Not Found (data tidak ditemukan)
- `500` - Internal Server Error

---

## Usage Example (Mobile App)

```typescript
// Fetch dashboard data
const dashboardResponse = await fetch('https://validator.crxanode.me/api/dashboard');
const dashboardData = await dashboardResponse.json();

// Fetch specific validator
const validatorAddress = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';
const validatorResponse = await fetch(`https://validator.crxanode.me/api/validator/${validatorAddress}`);
const validatorData = await validatorResponse.json();

// Fetch recap
const recapResponse = await fetch('https://validator.crxanode.me/api/recap');
const recapData = await recapResponse.json();
```
