# Migration Guide - Upgrading to Rate Limiting & Queue System

This guide helps integrate the new rate limiting and queueing system into existing client code.

## Phase 1: Backend Deployment (Already Complete)

- ✅ Device fingerprinting utility added
- ✅ Rate limiter middleware integrated
- ✅ Request queue service added
- ✅ Race condition handler implemented
- ✅ Admin endpoints configured
- ✅ Documentation prepared

## Phase 2: Client-Side Updates (For Teams)

### Step 1: Add Device UUID Support

#### Mobile (Flutter)
```dart
// OLD CODE
const response = await http.get(
  Uri.parse('$API_URL/api/populate/read/tasks'),
  headers: {
    'Authorization': 'Bearer $token',
  },
);

// NEW CODE - Add device UUID
import 'package:device_info_plus/device_info_plus.dart';
import 'package:shared_preferences/shared_preferences.dart';

class DeviceIdentifier {
  static Future<String> getDeviceUuid() async {
    final prefs = await SharedPreferences.getInstance();
    var uuid = prefs.getString('device_uuid');
    
    if (uuid == null) {
      final deviceInfo = DeviceInfoPlugin();
      final androidInfo = await deviceInfo.androidInfo;
      uuid = androidInfo.id; // Use Android device ID
      
      await prefs.setString('device_uuid', uuid);
    }
    
    return uuid;
  }
}

// Usage in API calls
final deviceUuid = await DeviceIdentifier.getDeviceUuid();
const response = await http.get(
  Uri.parse('$API_URL/api/populate/read/tasks'),
  headers: {
    'Authorization': 'Bearer $token',
    'x-device-uuid': deviceUuid,
    'x-source': 'flutter',
  },
);
```

#### React Native
```javascript
// OLD CODE
const response = await fetch('/api/populate/read/tasks', {
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});

// NEW CODE - Add device UUID
import { v4 as uuidv4 } from 'uuid';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter, Platform } from 'react-native';

async function getDeviceUUID() {
  const stored = await AsyncStorage.getItem('deviceUuid');
  if (stored) return stored;
  
  const uuid = uuidv4();
  await AsyncStorage.setItem('deviceUuid', uuid);
  return uuid;
}

// Usage
const deviceUuid = await getDeviceUUID();
const response = await fetch('/api/populate/read/tasks', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'x-device-uuid': deviceUuid,
    'x-source': 'react-native',
  },
});
```

#### Web (JavaScript)
```javascript
// OLD CODE
const response = await fetch('/api/populate/read/tasks', {
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});

// NEW CODE - Add device UUID
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function getDeviceUUID() {
  let uuid = localStorage.getItem('deviceUuid');
  if (!uuid) {
    uuid = generateUUID();
    localStorage.setItem('deviceUuid', uuid);
  }
  return uuid;
}

// Usage
const deviceUuid = getDeviceUUID();
const response = await fetch('/api/populate/read/tasks', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'x-device-uuid': deviceUuid,
    'x-source': 'web',
  },
});
```

### Step 2: Implement Rate Limit Handling

#### OLD CODE (No Error Handling)
```javascript
async function fetchTasks() {
  const response = await fetch('/api/populate/read/tasks', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  
  return response.json();
}
```

#### NEW CODE (With Retry)
```javascript
async function fetchTasks(maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const response = await fetch('/api/populate/read/tasks', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    // Rate limited
    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get('Retry-After')) || 1;
      console.log(`Rate limited. Retrying in ${retryAfter}s...`);
      
      await new Promise(resolve => 
        setTimeout(resolve, retryAfter * 1000)
      );
      continue;
    }

    // Server error or conflict
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  throw new Error('Max retries exceeded');
}
```

### Step 3: Handle Race Conditions (Conflicts)

#### OLD CODE (No Conflict Handling)
```javascript
async function updateTask(taskId, updates) {
  const response = await fetch(`/api/populate/update/tasks/${taskId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates)
  });

  return response.json();
}
```

#### NEW CODE (With Conflict Retry)
```javascript
async function updateTask(taskId, updates, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    // First, fetch current state
    const current = await fetch(
      `/api/populate/read/tasks/${taskId}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    const task = await current.json();

    // Attempt update with current version
    const response = await fetch(
      `/api/populate/update/tasks/${taskId}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-device-uuid': getDeviceUUID(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...updates,
          __v: task.data.__v  // Include version for conflict detection
        })
      }
    );

    // Conflict - another device modified it
    if (response.status === 409) {
      const error = await response.json();
      console.log(`Conflict: ${error.message}. Retrying...`);
      
      // Wait before retrying
      const wait = error.waitTime || 1;
      await new Promise(resolve => 
        setTimeout(resolve, wait * 1000)
      );
      continue;
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response.json();
  }

  throw new Error('Could not update task - too many conflicts');
}
```

### Step 4: Create API Helper Class

#### TypeScript Version
```typescript
import axios, { AxiosInstance } from 'axios';

class LoigmaxAPIClient {
  private client: AxiosInstance;
  private deviceUuid: string;
  private token: string;

  constructor(baseURL: string, token: string, deviceUuid?: string) {
    this.token = token;
    this.deviceUuid = deviceUuid || this.generateUUID();

    this.client = axios.create({
      baseURL,
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-device-uuid': this.deviceUuid,
        'Content-Type': 'application/json'
      }
    });

    // Add response interceptor for rate limiting
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 429) {
          const retryAfter = parseInt(
            error.response.headers['retry-after']
          ) || 1;
          
          console.warn(`Rate limited. Retrying in ${retryAfter}s...`);
          await new Promise(r => 
            setTimeout(r, retryAfter * 1000)
          );
          
          return this.client(error.config);
        }

        throw error;
      }
    );
  }

  async readTasks() {
    const response = await this.client.get('/api/populate/read/tasks');
    return response.data.data;
  }

  async updateTask(taskId: string, updates: any) {
    const response = await this.client.put(
      `/api/populate/update/tasks/${taskId}`,
      updates
    );
    return response.data.data;
  }

  async bulkUpsert(model: string, items: any[]) {
    const response = await this.client.post(
      `/api/populate/bulk-upsert/${model}`,
      items
    );
    return response.data;
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}

// Usage
const api = new LoigmaxAPIClient(
  'http://localhost:3000',
  'your-token',
  'your-device-uuid'
);

const tasks = await api.readTasks();
const updated = await api.updateTask('taskId', { status: 'done' });
```

#### JavaScript Version
```javascript
class LoigmaxAPIClient {
  constructor(baseURL, token, deviceUuid = null) {
    this.baseURL = baseURL;
    this.token = token;
    this.deviceUuid = deviceUuid || this.generateUUID();
  }

  async request(method, endpoint, data = null, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(
          `${this.baseURL}${endpoint}`,
          {
            method,
            headers: {
              'Authorization': `Bearer ${this.token}`,
              'x-device-uuid': this.deviceUuid,
              'Content-Type': 'application/json'
            },
            body: data ? JSON.stringify(data) : null
          }
        );

        if (response.status === 429) {
          const retryAfter = parseInt(
            response.headers.get('retry-after')
          ) || 1;
          console.warn(`Rate limited. Retrying in ${retryAfter}s...`);
          await new Promise(r => 
            setTimeout(r, retryAfter * 1000)
          );
          continue;
        }

        if (response.status === 409) {
          console.warn('Document conflict. Retrying...');
          await new Promise(r => setTimeout(r, 500 * attempt));
          continue;
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        return response.json();
      } catch (error) {
        if (attempt === maxRetries) throw error;
        await new Promise(r => setTimeout(r, 100 * attempt));
      }
    }
  }

  readTasks() {
    return this.request('GET', '/api/populate/read/tasks');
  }

  updateTask(taskId, updates) {
    return this.request(
      'PUT',
      `/api/populate/update/tasks/${taskId}`,
      updates
    );
  }

  bulkUpsert(model, items) {
    return this.request(
      'POST',
      `/api/populate/bulk-upsert/${model}`,
      items
    );
  }

  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}

// Usage
const api = new LoigmaxAPIClient(
  'http://localhost:3000',
  'your-token'
);

api.readTasks().then(tasks => console.log(tasks));
```

## Phase 3: Monitoring & Verification

### 1. Check Rate Limit Headers

```bash
curl -v http://localhost:3000/api/populate/read/tasks \
  -H "Authorization: Bearer TOKEN" \
  -H "x-device-uuid: test-device"

# Look for these headers in response:
# RateLimit-Remaining-Second: X
# RateLimit-Remaining-Minute: Y
```

### 2. Test Rate Limiting

```bash
#!/bin/bash
# Send 15 rapid requests to trigger rate limit
for i in {1..20}; do
  curl -s http://localhost:3000/api/populate/read/tasks \
    -H "Authorization: Bearer TOKEN" \
    -H "x-device-uuid: test-device" \
    | jq '.success'
done
```

### 3. Test Conflict Handling

```bash
#!/bin/bash
# Open 2 terminals and run simultaneously:
# Terminal 1:
curl -X PUT http://localhost:3000/api/populate/update/documents/123 \
  -H "Authorization: Bearer TOKEN" \
  -H "x-device-uuid: device-1" \
  -d '{"value": "update1"}'

# Terminal 2:
curl -X PUT http://localhost:3000/api/populate/update/documents/123 \
  -H "Authorization: Bearer TOKEN" \
  -H "x-device-uuid: device-2" \
  -d '{"value": "update2"}'

# One should get 409 Conflict
```

### 4. Monitor System Health

```bash
curl http://localhost:3000/api/admin/system/health \
  -H "Authorization: Bearer ADMIN_TOKEN" | jq '.'
```

## Phase 4: Rollback Plan

If issues occur, you can:

1. **Disable rate limiting** (keep system running):
```javascript
// In index.js
app.use(rateLimitMiddleware({ enabled: false }));
```

2. **Disable race condition handling**:
```javascript
app.use(raceConditionMiddleware({ enabled: false }));
```

3. **Emergency reset all queues/locks**:
```bash
curl -X POST http://localhost:3000/api/admin/system/reset \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{"confirmReset": true}'
```

4. **Full rollback** (remove all new code):
- Revert `src/index.js` changes
- Remove middleware imports
- Remove rate limit/queue middleware from pipeline
- System continues with original behavior

## Timeline

| Phase | Duration | Action |
|-------|----------|--------|
| 1 | Done | Backend deployment |
| 2 | 1-2 weeks | Client SDK updates |
| 3 | 1 week | Testing and monitoring |
| 4 | Ongoing | Production rollout |

## Support

- 📚 Documentation: `src/RATE_LIMIT_QUEUE_DOCUMENTATION.md`
- 📋 Quick Reference: `src/QUICK_REFERENCE_RATE_LIMIT.md`
- 🔧 Configuration: `src/.env.rate-limit.template`
- 💬 Issues: Open GitHub issue with `[rate-limit]` tag

