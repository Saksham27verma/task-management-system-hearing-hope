// Permission resources, representing different areas of the application
export const RESOURCES = {
  TASKS: 'tasks',
  USERS: 'users',
  REPORTS: 'reports',
  NOTICES: 'notices',
  MESSAGES: 'messages',
  COMPANY: 'company',
  CALENDAR: 'calendar',
  SETTINGS: 'settings'
} as const;

// Permission actions, representing what a user can do with a resource
export const ACTIONS = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  ASSIGN: 'assign',
  COMPLETE: 'complete',
  EXPORT: 'export',
  APPROVE: 'approve'
} as const;

// Create types from the constants
export type Resource = typeof RESOURCES[keyof typeof RESOURCES];
export type Action = typeof ACTIONS[keyof typeof ACTIONS];

// A permission is a combination of a resource and an action
export type Permission = string;

// Define pre-configured permission sets for different roles
export const ROLE_PERMISSIONS = {
  SUPER_ADMIN: [
    // Task permissions
    'tasks:create', 'tasks:read', 'tasks:update', 'tasks:delete', 'tasks:assign', 'tasks:complete', 
    // User permissions
    'users:create', 'users:read', 'users:update', 'users:delete',
    // Report permissions
    'reports:read', 'reports:create', 'reports:export',
    // Notice permissions
    'notices:create', 'notices:read', 'notices:update', 'notices:delete',
    // Message permissions
    'messages:create', 'messages:read', 'messages:delete',
    // Company permissions
    'company:read', 'company:update',
    // Calendar permissions
    'calendar:read', 'calendar:update',
    // Settings permissions
    'settings:read', 'settings:update'
  ],
  MANAGER: [
    // Task permissions
    'tasks:create', 'tasks:read', 'tasks:update', 'tasks:assign', 'tasks:complete',
    // User permissions (limited)
    'users:read',
    // Report permissions
    'reports:read', 'reports:create', 'reports:export',
    // Notice permissions
    'notices:create', 'notices:read', 'notices:update',
    // Message permissions
    'messages:create', 'messages:read', 'messages:delete',
    // Calendar permissions
    'calendar:read', 'calendar:update'
  ],
  EMPLOYEE: [
    // Task permissions (limited)
    'tasks:read', 'tasks:update', 'tasks:complete',
    // User permissions (limited)
    'users:read',
    // Notice permissions (limited)
    'notices:read',
    // Message permissions
    'messages:create', 'messages:read', 'messages:delete',
    // Calendar permissions (limited)
    'calendar:read'
  ]
} as const; 