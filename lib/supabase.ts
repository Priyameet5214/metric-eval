// ─────────────────────────────────────────────────────────────────────────────
// Primitives
// ─────────────────────────────────────────────────────────────────────────────

export type UUID = string;
export type ISOTimestamp = string; // e.g. "2024-01-15T10:30:00.000Z"
export type Comparator = 'GT' | 'LT' | 'GTE' | 'LTE' | 'EQ';

// ─────────────────────────────────────────────────────────────────────────────
// Database row types (mirror the Supabase schema exactly)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Row in the `alerts` table.
 * Stores a user-configured alert rule.
 */
export interface Alert {
  id: UUID;
  user_id: UUID | null;
  metric_name: string;
  threshold: number;
  comparator: Comparator;
  message: string;
  cooldown_seconds: number;        // 0 = no cooldown
  last_triggered_at: ISOTimestamp | null;
  created_at: ISOTimestamp;
  updated_at: ISOTimestamp;
}

/**
 * Row in the `alert_events` table.
 * Created each time an alert rule fires (subject to cooldown).
 */
export interface AlertEvent {
  id: UUID;
  user_id: UUID | null;
  alert_id: UUID;
  metric_name: string;
  metric_value: number;
  timestamp: ISOTimestamp;
  alert_message: string;
}

/**
 * Row in the `metrics` table.
 * Raw metric data points persisted on every ingestion call.
 */
export interface Metric {
  id: UUID;
  user_id: UUID | null;
  metric_name: string;
  value: number;
  recorded_at: ISOTimestamp;
  created_at: ISOTimestamp;
}

// ─────────────────────────────────────────────────────────────────────────────
// Supabase Database type map (use with createClient<Database>())
// ─────────────────────────────────────────────────────────────────────────────

export interface Database {
  public: {
    Tables: {
      alerts: {
        Row: Alert;
        Insert: Omit<Alert, 'id' | 'created_at' | 'updated_at' | 'last_triggered_at'> & {
          id?: UUID;
          last_triggered_at?: ISOTimestamp | null;
          created_at?: ISOTimestamp;
          updated_at?: ISOTimestamp;
        };
        Update: Partial<Omit<Alert, 'id' | 'created_at'>>;
      };
      alert_events: {
        Row: AlertEvent;
        Insert: Omit<AlertEvent, 'id' | 'timestamp'> & {
          id?: UUID;
          timestamp?: ISOTimestamp;
        };
        Update: never; // events are immutable
      };
      metrics: {
        Row: Metric;
        Insert: Omit<Metric, 'id' | 'created_at'> & {
          id?: UUID;
          created_at?: ISOTimestamp;
        };
        Update: never; // raw metric rows are immutable
      };
    };
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// API request / response payloads
// ─────────────────────────────────────────────────────────────────────────────

/** POST /api/alerts */
export interface CreateAlertPayload {
  metric_name: string;
  threshold: number;
  comparator: Comparator;
  message: string;
  cooldown_seconds?: number; // defaults to 0
}

/** POST /api/metrics */
export interface MetricPayload {
  metric_name: string;
  value: number;
  timestamp?: ISOTimestamp; // defaults to now()
  user_id?: UUID;
}

/** Response from POST /api/metrics */
export interface MetricIngestResponse {
  message: string;
  evaluated: number;
  triggered: number;
  cooldown_skipped: number;
}

/** Generic API error shape */
export interface ApiError {
  error: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// UI / component helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Lightweight version of Alert used for display in lists */
export type AlertSummary = Pick<
  Alert,
  'id' | 'metric_name' | 'threshold' | 'comparator' | 'message' | 'cooldown_seconds' | 'last_triggered_at' | 'created_at'
>;

/** Form state for the create-alert form */
export interface AlertFormState {
  metric_name: string;
  threshold: string;         // string while editing, parsed to number on submit
  comparator: Comparator;
  message: string;
  cooldown_seconds: string;  // string while editing
}

export type AlertFormErrors = Partial<Record<keyof AlertFormState, string>>;

/** Form state for the metric simulator */
export interface MetricFormState {
  metric_name: string;
  value: string;
  timestamp: string;         // empty string means "use now"
}

export type MetricFormErrors = Partial<Record<keyof MetricFormState, string>>;

/** Preset for the metric simulator quick-fire buttons */
export interface MetricPreset {
  label: string;
  metric_name: string;
  value: number;
}
