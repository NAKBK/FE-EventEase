export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export type Role = "attendee" | "organizer";
export type WalkingDistance = "short" | "moderate" | "any";
export type RequestStatus = "pending" | "responded" | "confirmed" | "closed" | "verified";
export type VerificationValue = "fulfilled" | "partially_fulfilled" | "not_fulfilled";

export interface NeedProfile {
  step_free_entrance: boolean;
  elevator_or_ramp: boolean;
  accessible_restroom: boolean;
  accessible_seating: boolean;
  rest_area: boolean;
  parking_or_dropoff: boolean;
  walking_distance: WalkingDistance;
}

export interface UserSession {
  token: string;
  user: {
    id: string;
    name: string;
    role: Role;
    organizer_id: string | null;
  };
}

export interface EventListItem {
  id: string;
  title: string;
  starts_at: string;
  status: "upcoming" | "completed";
  venue: {
    id: string;
    name: string;
    city: string;
    lat?: number | null;
    lng?: number | null;
  };
  organizer: {
    id: string;
    name: string;
    reliability_score: number | null;
    sample_count: number;
  };
}

export interface Claim {
  step_free_entrance: 0 | 0.5 | 1 | null;
  elevator_or_ramp: 0 | 0.5 | 1 | null;
  accessible_restroom: 0 | 0.5 | 1 | null;
  accessible_seating: 0 | 0.5 | 1 | null;
  rest_area: 0 | 0.5 | 1 | null;
  parking_or_dropoff: 0 | 0.5 | 1 | null;
  walking_distance_m: number | null;
  source: "organizer" | "open_data" | "demo";
  checked_at: string;
}

export interface EventDetail extends EventListItem {
  description: string;
  ends_at: string;
  venue: EventListItem["venue"] & {
    address: string;
  };
  claim: Claim;
  media: Array<{
    id: string;
    event_id: string;
    url: string;
    uploaded_at: string;
  }>;
}

export interface EventListResponse {
  items: EventListItem[];
  total: number;
  limit: number;
  offset: number;
}

export interface MatchResponse {
  event_id: string;
  score: number;
  weight_version: string;
  breakdown: Array<{
    attribute: keyof NeedProfile;
    required: boolean;
    weight: number;
    fulfillment: 0 | 0.5 | 1 | null;
    label: "fulfilled" | "partially_fulfilled" | "not_fulfilled" | "unknown";
  }>;
  unknown_attributes: string[];
  summary: string;
}

export interface AccessibilityRequest {
  id: string;
  event_id: string;
  event_title: string;
  status: RequestStatus;
  arrival_estimate: string;
  note: string;
  needs_snapshot: NeedProfile;
  response: null | {
    decision: "can_fulfill" | "partially_fulfill" | "cannot_fulfill";
    note: string;
    responded_at: string;
  };
  created_at: string;
}

export interface RequestListResponse {
  items: AccessibilityRequest[];
  total: number;
  limit: number;
  offset: number;
}

export interface NeedsResponse {
  profile: NeedProfile | null;
  updated_at: string | null;
}

export interface DashboardResponse {
  pending_requests_count: number;
  active_event: null | {
    request_id: string;
    event: EventDetail;
    match: Pick<MatchResponse, "score" | "weight_version" | "unknown_attributes">;
  };
  recent_requests: AccessibilityRequest[];
}

const jsonHeaders = {
  "Content-Type": "application/json",
  Accept: "application/json",
};

export function saveSession(data: UserSession) {
  localStorage.setItem("token", data.token);
  localStorage.setItem("role", data.user.role);
  localStorage.setItem("user_id", data.user.id);
  localStorage.setItem("name", data.user.name);
  if (data.user.organizer_id) {
    localStorage.setItem("organizer_id", data.user.organizer_id);
  } else {
    localStorage.removeItem("organizer_id");
  }
}

export function clearSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("user_id");
  localStorage.removeItem("name");
  localStorage.removeItem("organizer_id");
}

export function getToken() {
  return localStorage.getItem("token");
}

export function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

async function parseResponse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      data?.error?.message ||
      data?.message ||
      `API merespons dengan status ${response.status}`;
    throw new Error(message);
  }

  return data as T;
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(init.headers);

  if (!headers.has("Accept")) headers.set("Accept", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  return parseResponse<T>(response);
}

export async function login(email: string, password: string) {
  return apiFetch<UserSession>("/api/auth/login", {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({ email, password }),
  });
}

export async function demoLogin(account: Role) {
  return apiFetch<UserSession>("/api/auth/demo-login", {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({ account }),
  });
}

export async function register(payload: {
  name: string;
  email: string;
  password: string;
  role: Role;
}) {
  return apiFetch<UserSession>("/api/auth/register", {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify(payload),
  });
}

export function listEvents(query: Record<string, string | number | boolean | undefined> = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== "") params.set(key, String(value));
  });

  const qs = params.toString();
  return apiFetch<EventListResponse>(`/api/events${qs ? `?${qs}` : ""}`);
}

export function getEvent(eventId: string) {
  return apiFetch<EventDetail>(`/api/events/${eventId}`);
}

export function getEventMatch(eventId: string) {
  return apiFetch<MatchResponse>(`/api/events/${eventId}/match`);
}

export function getNeeds() {
  return apiFetch<NeedsResponse>("/api/me/needs");
}

export function saveNeeds(profile: NeedProfile) {
  return apiFetch<NeedsResponse>("/api/me/needs", {
    method: "PUT",
    headers: jsonHeaders,
    body: JSON.stringify(profile),
  });
}

export function createRequest(
  eventId: string,
  payload: {
    arrival_estimate: string;
    note: string;
  },
) {
  return apiFetch<AccessibilityRequest>(`/api/events/${eventId}/requests`, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify(payload),
  });
}

export function listRequests(status?: RequestStatus) {
  const params = new URLSearchParams({ limit: "50", offset: "0" });
  if (status) params.set("status", status);
  return apiFetch<RequestListResponse>(`/api/requests?${params.toString()}`);
}

export function confirmRequest(requestId: string, accepted: boolean) {
  return apiFetch<AccessibilityRequest>(`/api/requests/${requestId}/confirm`, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({ accepted }),
  });
}

export function submitVerification(
  requestId: string,
  attributes: Record<keyof NeedProfile, VerificationValue>,
) {
  return apiFetch<{
    id: string;
    request_id: string;
    status: "verified";
    submitted_at: string;
    organizer_reliability: {
      score: number | null;
      sample_count: number;
    };
  }>(`/api/requests/${requestId}/verification`, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({ attributes }),
  });
}

export function getDashboard() {
  return apiFetch<DashboardResponse>("/api/me/dashboard");
}
