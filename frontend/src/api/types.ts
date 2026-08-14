export type TopicStatus = "todo" | "in_progress" | "done";
export type GoalStatus = "open" | "completed" | "missed";
export type ResourceType = "link" | "note";

export interface Subject {
  id: number;
  name: string;
  description: string | null;
  color: string | null;
  target_date: string | null;
  sr_initial_interval_days: number | null;
  sr_ease_factor: number | null;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: number;
  name: string;
  color: string | null;
  created_at: string;
}

export interface Topic {
  id: number;
  subject_id: number;
  name: string;
  description: string | null;
  status: TopicStatus;
  order_index: number | null;
  notes: string | null;
  target_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  tags: Tag[];
  parent_topic_id: number | null;
}

export interface StudySession {
  id: number;
  subject_id: number;
  topic_id: number | null;
  session_date: string;
  duration_minutes: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Resource {
  id: number;
  topic_id: number;
  type: ResourceType;
  title: string;
  url: string | null;
  content: string | null;
  created_at: string;
}

export interface RecurringPlan {
  id: number;
  subject_id: number;
  topic_id: number | null;
  days_of_week: number;
  created_at: string;
  updated_at: string;
}

export interface TodayPlanItem {
  id: number;
  subject_id: number;
  subject_name: string;
  topic_id: number | null;
  topic_name: string | null;
}

export interface Goal {
  id: number;
  subject_id: number | null;
  topic_id: number | null;
  title: string;
  target_date: string;
  status: GoalStatus;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}
