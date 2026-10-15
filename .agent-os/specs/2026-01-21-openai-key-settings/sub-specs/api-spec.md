# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2026-01-21-openai-key-settings/spec.md

## Endpoints

### GET /api/user/settings/api-key/status

**Purpose:** Check if user has an API key configured (without exposing the key)

**Authentication:** Required (Supabase Auth)

**Parameters:** None

**Response:**
```json
{
  "hasKey": true,
  "maskedKey": "sk-...abc123"
}
```
or
```json
{
  "hasKey": false,
  "maskedKey": null
}
```

**Errors:**
- 401: Unauthorized (not logged in)
- 500: Server error

---

### POST /api/user/settings/api-key

**Purpose:** Save or update user's OpenAI API key

**Authentication:** Required (Supabase Auth)

**Request Body:**
```json
{
  "apiKey": "sk-proj-xxxxxxxxxxxxx"
}
```

**Validation:**
- apiKey must be a non-empty string
- apiKey must start with "sk-"
- apiKey minimum length: 20 characters

**Response:**
```json
{
  "success": true,
  "message": "API key saved successfully",
  "maskedKey": "sk-...abc123"
}
```

**Errors:**
- 400: Invalid API key format
- 401: Unauthorized
- 500: Encryption or database error

---

### DELETE /api/user/settings/api-key

**Purpose:** Remove user's stored API key

**Authentication:** Required (Supabase Auth)

**Parameters:** None

**Response:**
```json
{
  "success": true,
  "message": "API key removed successfully"
}
```

**Errors:**
- 401: Unauthorized
- 404: No API key found
- 500: Database error

---

## Updated AI Endpoints

All existing AI endpoints will be modified to:

1. Authenticate user via Supabase Auth
2. Fetch and decrypt user's API key from user_settings table
3. Use decrypted key for OpenAI API call
4. Return 401 with specific message if no key configured

### Updated Response for Missing Key

All AI endpoints (`/api/ai/*`) will return this when no key is configured:

```json
{
  "error": "API key not configured",
  "code": "NO_API_KEY",
  "message": "Please add your OpenAI API key in Settings to use AI features"
}
```

**Status Code:** 401 Unauthorized

---

## Server-Side Encryption Utility

Location: `lib/encryption.ts`

```typescript
interface EncryptedData {
  encrypted: string;  // base64
  iv: string;         // base64
  tag: string;        // base64
}

function encrypt(plaintext: string): EncryptedData
function decrypt(data: EncryptedData): string
function maskApiKey(key: string): string  // Returns "sk-...abc123"
```

Environment variable required: `API_KEY_ENCRYPTION_SECRET` (32-byte hex string)
