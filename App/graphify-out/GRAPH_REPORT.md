# Graph Report - App  (2026-06-17)

## Corpus Check
- 75 files · ~55,430 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 426 nodes · 492 edges · 37 communities (33 shown, 4 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `37424abc`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 33|Community 33]]

## God Nodes (most connected - your core abstractions)
1. `expo` - 18 edges
2. `AuthContext` - 14 edges
3. `useThemeColor()` - 8 edges
4. `React Native App Updates Summary` - 8 edges
5. `Updated Components` - 8 edges
6. `android` - 7 edges
7. `scripts` - 7 edges
8. `useOptimizedDataFetching()` - 7 edges
9. `Attendance()` - 6 edges
10. `adaptiveIcon` - 5 edges

## Surprising Connections (you probably didn't know these)
- `TasksIndex()` --calls--> `useOptimizedDataFetching()`  [EXTRACTED]
  app/(protectedRoute)/tasks/index.tsx → hooks/useOptimizedDataFetching.js
- `AppHeader()` --calls--> `useNotification()`  [EXTRACTED]
  components/AppHeader.tsx → context/NotificationContext.tsx
- `NotificationDrawer()` --calls--> `useNotification()`  [EXTRACTED]
  components/NotificationDrawer.tsx → context/NotificationContext.tsx
- `ParallaxScrollView()` --calls--> `useColorScheme()`  [INFERRED]
  components/parallax-scroll-view.tsx → hooks/use-color-scheme.web.ts
- `Collapsible()` --calls--> `useColorScheme()`  [INFERRED]
  components/ui/collapsible.tsx → hooks/use-color-scheme.web.ts

## Communities (37 total, 4 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (28): axiosInstance, forceLogout(), getDeviceUUID(), incrementFailedCount(), setAuthLogout(), ProjectType, Task, AuthContext (+20 more)

### Community 1 - "Community 1"
Cohesion: 0.04
Nodes (49): dependencies, axios, expo, expo-constants, expo-dev-client, expo-device, expo-document-picker, expo-font (+41 more)

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (32): projectId, reactCompiler, typedRoutes, expo, experiments, extra, icon, ios (+24 more)

### Community 3 - "Community 3"
Cohesion: 0.06
Nodes (30): 1. **Enhanced Axios Instance** (`api/axiosInstance.js`), 2. **Optimized API Hook** (`hooks/useOptimizedAPI.js`), 3. **Optimized Data Fetching Hook** (`hooks/useOptimizedDataFetching.js`), 4. **OptimizedList Component** (`components/ui/OptimizedList.tsx`), 5. **Performance Monitor Hook** (`hooks/usePerformanceMonitor.js`), 6. **Updated Dashboard** (`app/(protectedRoute)/dashboard/index.tsx`), 7. **Updated Tasks Page** (`app/(protectedRoute)/tasks/index.tsx`), Backend Integration (+22 more)

### Community 4 - "Community 4"
Cohesion: 0.12
Nodes (19): styles, ParallaxScrollView(), Props, styles, styles, ThemedText(), ThemedTextProps, ThemedView() (+11 more)

### Community 5 - "Community 5"
Cohesion: 0.09
Nodes (14): Dashboard(), getFormattedDate(), getGreeting(), STATUS_STYLES, EmployeeDashboard(), EmployeeDashboardStats, getAttendanceConfig(), Props (+6 more)

### Community 6 - "Community 6"
Cohesion: 0.10
Nodes (20): devDependencies, @babel/plugin-transform-class-properties, @babel/plugin-transform-private-methods, @babel/plugin-transform-private-property-in-object, babel-preset-expo, eslint, eslint-config-expo, @types/react (+12 more)

### Community 7 - "Community 7"
Cohesion: 0.13
Nodes (12): LeaveAndRegularizationScreen(), leaveFormFields(), leaveSubmitButton, profileFormFields(), profileSubmitButton, regularizationFormFields, regularizationSubmitButton, Employee (+4 more)

### Community 8 - "Community 8"
Cohesion: 0.14
Nodes (11): AppHeader(), NotificationDrawer(), NotificationDrawerProps, { width }, Notification, NotificationContext, NotificationContextType, NotificationProvider() (+3 more)

### Community 9 - "Community 9"
Cohesion: 0.12
Nodes (15): buildType, build, development, preview, production, cli, appVersionSource, version (+7 more)

### Community 10 - "Community 10"
Cohesion: 0.18
Nodes (11): Attendance(), calcDuration(), fmtMonthLabel(), fmtWeekLabel(), formatTime(), getWeekRange(), Activity, Client (+3 more)

### Community 11 - "Community 11"
Cohesion: 0.18
Nodes (11): backgroundColor, backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, edgeToEdgeEnabled, googleServicesFile, package (+3 more)

### Community 12 - "Community 12"
Cohesion: 0.16
Nodes (14): useOptimizedAPI(), memoryCache, useOptimizedDataFetching(), Client, PRIORITY_COLORS, ProjectType, STATUS_COLORS, STATUS_TABS (+6 more)

### Community 13 - "Community 13"
Cohesion: 0.33
Nodes (4): Client, Employee, ProjectType, TaskType

### Community 14 - "Community 14"
Cohesion: 0.29
Nodes (3): InlineEditProps, statusColors, Task

### Community 15 - "Community 15"
Cohesion: 0.29
Nodes (6): compilerOptions, paths, strict, extends, include, @/*

### Community 16 - "Community 16"
Cohesion: 0.29
Nodes (3): BRAND_GRADIENT, Props, { width, height }

### Community 17 - "Community 17"
Cohesion: 0.29
Nodes (6): client, configuration_version, project_info, project_id, project_number, storage_bucket

### Community 18 - "Community 18"
Cohesion: 0.40
Nodes (3): priorityColors, statusColors, Task

### Community 19 - "Community 19"
Cohesion: 0.40
Nodes (4): config, { getDefaultConfig }, path, { withNativeWind }

### Community 20 - "Community 20"
Cohesion: 0.40
Nodes (4): editor.codeActionsOnSave, source.fixAll, source.organizeImports, source.sortMembers

### Community 21 - "Community 21"
Cohesion: 0.67
Nodes (3): StatCard(), StatCardProps, useAnimatedCounter()

## Knowledge Gaps
- **226 isolated node(s):** `name`, `slug`, `version`, `orientation`, `icon` (+221 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `Community 1` to `Community 6`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Why does `AuthContext` connect `Community 0` to `Community 5`, `Community 7`, `Community 8`, `Community 10`, `Community 12`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Why does `expo` connect `Community 2` to `Community 11`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **What connects `name`, `slug`, `version` to the rest of the system?**
  _226 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.05660377358490566 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.04081632653061224 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.06060606060606061 - nodes in this community are weakly interconnected._