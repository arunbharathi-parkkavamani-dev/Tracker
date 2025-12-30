# Reports API Query Format

## Endpoint
```
POST /api/populate/report/{modelName}
```

## Query Structure
```json
{
  "type": "summary", // or "details"
  "groupBy": "fieldName",
  "subGroupBy": "fieldName", // optional for nested grouping
  "filter": {},
  "dateRange": {
    "startDate": "2024-01-01",
    "endDate": "2024-12-31",
    "dateField": "createdAt"
  },
  "populate": ["fieldName"],
  "sum": ["numericField"],
  "sort": { "total": -1 },
  "limit": 100
}
```

## Examples

### 1. Attendance by Employee with Status Breakdown
```json
POST /api/populate/report/attendances
{
  "type": "summary",
  "groupBy": "employee",
  "subGroupBy": "status",
  "populate": ["employee"],
  "dateRange": {
    "startDate": "2024-01-01",
    "endDate": "2024-01-31",
    "dateField": "date"
  }
}
```
**Response:**
```json
[
  { 
    "_id": "userId1", 
    "name": "John Doe", 
    "total": 28,
    "present": 22, 
    "absent": 2, 
    "weekoff": 4
  },
  { 
    "_id": "userId2", 
    "name": "Jane Smith", 
    "total": 25,
    "present": 20,
    "absent": 1,
    "weekoff": 4
  }
]
```

### 2. Tasks by Status (Summary)
```json
POST /api/populate/report/tasks
{
  "type": "summary",
  "groupBy": "status"
}
```
**Response:**
```json
[
  { "_id": "completed", "count": 45 },
  { "_id": "in_progress", "count": 23 },
  { "_id": "pending", "count": 12 }
]
```

### 3. Tasks by Client (Summary)
```json
POST /api/populate/report/tasks
{
  "type": "summary",
  "groupBy": "client",
  "populate": ["client"]
}
```
**Response:**
```json
[
  { "_id": "clientId1", "name": "ABC Corp", "count": 35 },
  { "_id": "clientId2", "name": "XYZ Ltd", "count": 28 }
]
```

### 4. Leave Details Report
```json
POST /api/populate/report/leaves
{
  "type": "details",
  "filter": { "status": "approved" },
  "populate": ["employee", "leaveType"],
  "fields": "employee startDate endDate days reason",
  "sort": { "startDate": -1 }
}
```

## Response Format

### Summary Type (with groupBy)
```json
[
  {
    "_id": "groupValue",
    "name": "Human Readable Name", // if populated
    "count": 25,
    "sumField": 150 // if sum specified
  }
]
```

### Details Type
```json
[
  {
    "_id": "recordId",
    "field1": "value1",
    "field2Data": [{ populated data }]
  }
]
```