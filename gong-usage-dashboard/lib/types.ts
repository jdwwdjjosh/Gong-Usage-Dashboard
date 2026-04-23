export type GongUser = {
  id: string;
  emailAddress?: string;
  firstName?: string;
  lastName?: string;
  active?: boolean;
  title?: string;
  managerId?: string;
};

export type GongCall = {
  id: string;
  primaryUserId?: string;
  started?: string;
  duration?: number;
  title?: string;
};

export type UserMetricRow = {
  gong_user_id: string;
  name: string;
  email: string;
  active: number;
  calls_recorded: number;
  active_days: number;
  login_events_proxy: number;
  last_activity_at: string | null;
};
