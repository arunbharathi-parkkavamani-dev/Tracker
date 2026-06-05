# Data Flow: Settings

## API Payloads
Extracted from React Components targeting the generic API endpoint.

- **role-permissions.jsx** -> `POST /populate/read/roles`
- **role-permissions.jsx** -> `GET /populate/read/accesspolicies`
- **role-permissions.jsx** -> `POST /populate/bulk-upsert/accesspolicies`
- **SidebarPolicy.jsx** -> `GET /populate/list/sidebars?limit=100&sort={`
- **SidebarPolicy.jsx** -> `POST /populate/list/departments`
- **SidebarPolicy.jsx** -> `POST /populate/list/designations`
- **SidebarPolicy.jsx** -> `PUT /populate/update/sidebars/${selectedItem._id}`
