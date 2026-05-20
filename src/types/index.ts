// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  companyId: string | null;
  roleId: string | null;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: string;
  employeeId?: string;
  department?: string;
  designation?: string;
  timezone: string;
  language: string;
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  isEmailVerified: boolean;
  isTwoFactorEnabled: boolean;
  lastLoginAt?: string;
  loginCount: number;
  preferences: UserPreferences;
  permissions: string[];
  role?: Role;
  company?: Company;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  sidebarCollapsed: boolean;
  notifications: boolean;
  emailNotifications: boolean;
  language: string;
  dateFormat: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// ─── Company ──────────────────────────────────────────────────────────────────
export interface Company {
  id: string;
  name: string;
  slug: string;
  email?: string;
  phone?: string;
  logo?: string;
  currency: string;
  timezone: string;
  plan: 'free' | 'basic' | 'professional' | 'enterprise';
  isActive: boolean;
  theme: CompanyTheme;
}

export interface CompanyTheme {
  primaryColor: string;
  logo?: string;
  darkMode: boolean;
}

// ─── Roles & Permissions ──────────────────────────────────────────────────────
export interface Role {
  id: string;
  companyId: string | null;
  name: string;
  slug: string;
  description?: string;
  isSystem: boolean;
  isActive: boolean;
  level: number;
  permissions?: Permission[];
}

export interface Permission {
  id: string;
  name: string;
  slug: string;
  module: string;
  action: string;
  description?: string;
}

// ─── Module ───────────────────────────────────────────────────────────────────
export interface Module {
  id: string;
  companyId: string;
  name: string;
  slug: string;
  description?: string;
  icon: string;
  color: string;
  tableName: string;
  category: ModuleCategory;
  isSystem: boolean;
  isActive: boolean;
  version: string;
  apiEndpoint: string;
  settings: ModuleSettings;
  listConfig: ListConfig;
  formConfig: FormConfig;
  fields?: ModuleField[];
  sortOrder: number;
}

export type ModuleCategory = 'core' | 'hrm' | 'crm' | 'finance' | 'inventory' | 'sales' | 'purchase' | 'projects' | 'support' | 'custom';

export interface ModuleSettings {
  allowExport: boolean;
  allowImport: boolean;
  allowBulkDelete: boolean;
  enableWorkflow: boolean;
  enableAuditLog: boolean;
  paginationDefault: number;
  searchEnabled: boolean;
}

export interface ListConfig {
  columns: string[];
  defaultSort: string;
  defaultSortOrder: 'ASC' | 'DESC';
  rowActions: string[];
  bulkActions: string[];
}

export interface FormConfig {
  layout: 'single-column' | 'two-column' | 'tabs';
  sections: FormSection[];
  submitLabel: string;
  cancelLabel: string;
}

export interface FormSection {
  id: string;
  title: string;
  fields: string[];
  collapsed?: boolean;
}

// ─── Module Field ─────────────────────────────────────────────────────────────
export type FieldType =
  | 'text' | 'textarea' | 'number' | 'decimal' | 'email' | 'phone' | 'url'
  | 'password' | 'date' | 'datetime' | 'time' | 'boolean' | 'select'
  | 'multiselect' | 'radio' | 'checkbox' | 'file' | 'image' | 'relation'
  | 'json' | 'color' | 'rating' | 'currency' | 'formula' | 'lookup'
  | 'autonumber' | 'signature' | 'richtext';

export interface ModuleField {
  id: string;
  moduleId: string;
  name: string;
  columnName: string;
  fieldType: FieldType;
  dataType?: string;
  label?: string;
  placeholder?: string;
  helpText?: string;
  defaultValue?: unknown;
  isRequired: boolean;
  isUnique: boolean;
  isReadOnly: boolean;
  isHidden: boolean;
  isSearchable: boolean;
  isSortable: boolean;
  isFilterable: boolean;
  showInList: boolean;
  showInForm: boolean;
  showInDetail: boolean;
  validation: Record<string, unknown>;
  options: FieldOption[];
  relationConfig?: RelationConfig | null;
  section?: string;
  colSpan: number;
  sortOrder: number;
  width: number;
}

export interface FieldOption {
  label: string;
  value: string;
  color?: string;
}

export interface RelationConfig {
  moduleId: string;
  displayField: string;
  valueField: string;
  multiple: boolean;
}

// ─── Menu ─────────────────────────────────────────────────────────────────────
export interface MenuItem {
  id: string;
  moduleId?: string;
  parentId?: string;
  name: string;
  path?: string;
  icon?: string;
  badge?: string;
  badgeColor?: string;
  isActive: boolean;
  isVisible: boolean;
  sortOrder: number;
  children?: MenuItem[];
  module?: Module;
}

// ─── API Types ────────────────────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  meta?: PaginationMeta;
  errors?: ValidationError[];
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface PaginatedData<T> {
  data: T[];
  meta: PaginationMeta;
}

// ─── Notification ─────────────────────────────────────────────────────────────
export interface Notification {
  id: string;
  userId: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'approval' | 'mention' | 'system' | 'reminder';
  title: string;
  message?: string;
  link?: string;
  module?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export interface DashboardStats {
  users: { total: number; active: number };
  modules: { total: number; active: number };
  activity: { last30Days: number };
}

// ─── Dynamic Record ───────────────────────────────────────────────────────────
export type DynamicRecord = Record<string, unknown>;

export interface DynamicListResult {
  data: DynamicRecord[];
  total: number;
  page: number;
  limit: number;
  module: {
    id: string;
    name: string;
    slug: string;
    fields: ModuleField[];
    settings: ModuleSettings;
    listConfig: ListConfig;
  };
}

// ─── Filter ───────────────────────────────────────────────────────────────────
export interface TableFilter {
  search: string;
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
  [key: string]: unknown;
}

// ─── Theme ────────────────────────────────────────────────────────────────────
export type Theme = 'light' | 'dark' | 'system';

export interface AppState {
  theme: Theme;
  sidebarCollapsed: boolean;
  sidebarMobileOpen: boolean;
  currentModule: Module | null;
  notifications: Notification[];
  unreadCount: number;
}
