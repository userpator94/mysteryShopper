// Основные типы данных для приложения

/** Роль пользователя: user — исполнитель (тайный покупатель), employer — заказчик */
export type UserRole = 'user' | 'employer';

/** Профиль текущего пользователя (GET /api/me) */
export interface MeUser {
  id: string;
  name: string;
  surname: string;
  email: string;
  phone: string;
  role: UserRole;
  /** Эмодзи-аватар исполнителя (закреплён при регистрации) */
  avatar_emoji?: string | null;
  email_verified?: boolean;
  company?: string;
  description?: string;
  website?: string;
}

/** Элемент кастомного чек-листа (согласовано с API) */
export type ChecklistItemType =
  | 'boolean'
  | 'scale_1_5'
  | 'text'
  | 'single_choice'
  /** Одно фото + текстовое пояснение; label — инструкция заказчика к кадру */
  | 'photo_text';

export interface ChecklistItem {
  id: string;
  type: ChecklistItemType;
  label: string;
  required: boolean;
  options?: string[];
}

export interface ChecklistSchema {
  items: ChecklistItem[];
}

/** Метка на карте (lng/lat — WGS84, как в Yandex Maps API) */
export interface LocationPoint {
  lng: number;
  lat: number;
  label?: string;
}

/** Тело запроса создания оффера (POST /api/offers). `price` — вознаграждение в бонусах (целое число). */
export interface CreateOfferPayload {
  title: string;
  description: string;
  /** Вознаграждение в бонусах (целое). Поле в API называется `price`. */
  price: number;
  location: string;
  /** Метки на карте; только при создании, опционально */
  location_points?: LocationPoint[] | null;
  requirements?: string;
  start_date: string;
  end_date: string;
  /** 999 — без ограничения числа исполнителей (как на бэкенде) */
  max_participants: number;
  is_promo?: boolean;
  image_id?: string;
  /** null — стандартный отчёт; объект — кастомный чек-лист */
  checklist_schema?: ChecklistSchema | null;
  schema_version?: number;
}

/** Тело запроса обновления оффера (PATCH /api/offers/:id) — все поля опциональны. `price` — вознаграждение в бонусах (целое). */
export interface UpdateOfferPayload {
  title?: string;
  description?: string;
  /** Вознаграждение в бонусах (целое). Поле в API называется `price`. */
  price?: number;
  location?: string;
  requirements?: string;
  tags?: string;
  start_date?: string;
  end_date?: string;
  max_participants?: number;
  is_promo?: boolean;
  is_active?: boolean;
  image_id?: string;
  checklist_schema?: ChecklistSchema | null;
  schema_version?: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  phone?: string;
  preferences: UserPreferences;
}

export interface UserPreferences {
  language: 'ru' | 'en' | 'uk';
  theme: 'light' | 'dark';
  notifications: boolean;
}

export interface Offer {
  id: string;
  image_id?: string;
  title: string;
  numeric_info: number;
  is_promo: boolean;
  employer_id: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  /** Вознаграждение в бонусах. Поле в API называется `price`. */
  price: string;
  /** 999 — без лимита исполнителей */
  max_participants: number;
  current_participants: number;
  description: string;
  requirements: string;
  location: string;
  location_points?: LocationPoint[] | null;
  created_at: string;
  updated_at: string;
  employer_name: string;
  employer_surname: string;
  employer_company: string;
  image_url?: string;
  image_alt_text?: string;
  /** null — без лимита мест; иначе свободные места */
  available_slots: number | null;
  /** Только для владельца: заявки в статусе pending */
  executors_pending?: Array<{ user_id: string; initials: string; avatar_emoji?: string | null }>;
  /** Только для владельца: приняты, отчёта ещё нет */
  executors_in_work?: Array<{ user_id: string; initials: string; avatar_emoji?: string | null }>;
  /** Только для владельца: есть отправленный отчёт по задаче */
  executors_reported?: Array<{ user_id: string; initials: string; avatar_emoji?: string | null }>;
  /** API может вернуть string или string[] (например ["[задача", "сложная", "деньги]"]) */
  tags?: string | string[];
  checklist_schema?: ChecklistSchema | null;
  schema_version?: number;
  /** false — заказчик не может менять задачу (есть отчёт или заявка в работе). См. API */
  can_edit?: boolean;
  /** Только владелец (GET /api/my/offers): заявок в статусе pending */
  pending_applications_count?: number;
  /** Только владелец (GET /api/my/offers): отчётов на проверке (pending_review) */
  pending_reports_count?: number;
}

/** Статус отчёта в API (модерация заказчиком). */
export type ApiReportStatus = 'pending_review' | 'approved' | 'rejected' | 'accepted_auto';

/** Строка списка отчётов для заказчика (GET /api/offers/:id/reports) и детали; у исполнителя GET /my-report — без executor_label */
export interface EmployerReportListItem {
  id: string;
  submitted_at: string;
  task_completed_at: string | null;
  rating: number | null;
  comments: string | null;
  feedback: unknown;
  checklist_answers: Record<string, unknown> | null;
  checklist_schema_version: number | null;
  checklist_schema_snapshot: ChecklistSchema | null;
  photos: unknown;
  executor_label?: string;
  executor_avatar_emoji?: string | null;
  /** id исполнителя (заказчик) — для ссылки на профиль */
  executor_user_id?: string;
  /** Устаревшее значение фронта; API: pending_review | approved | rejected */
  report_status?: ApiReportStatus | string;
  payment_status?: string;
  is_approved?: boolean;
  employer_review_comment?: string | null;
  reviewed_at?: string | null;
}

/** Заявка по задаче (список для заказчика GET /api/offers/:id/applications) */
export interface OfferApplicationRow {
  application_id: string;
  offer_id: string;
  user_id: string;
  applied_at: string;
  approved_at?: string;
  status?: string;
  employer_decision_comment?: string;
}

/** Заявка во входящих заказчика (GET /api/my/inbox/pending-applications) */
export interface InboxApplicationRow extends OfferApplicationRow {
  offer_title: string;
  offer_start_date?: string;
  offer_end_date?: string;
  executor_label?: string;
  executor_avatar_emoji?: string | null;
}

/** Отчёт во входящих заказчика (GET /api/my/inbox/pending-reports) */
export interface InboxReportRow extends EmployerReportListItem {
  offer_id: string;
  offer_title: string;
}

/** Публичные данные заказчика для исполнителя (GET /api/offers/:offerId/employer-summary) */
export interface EmployerPublicSummary {
  company: string;
  description: string | null;
  website: string | null;
}

/** Профиль исполнителя в кабинете заказчика (GET /api/offers/:offerId/executors/:id/profile) */
export interface EmployerExecutorProfile {
  user_id: string;
  masked_name: string;
  executor_label: string;
  avatar_url: string | null;
  avatar_emoji: string | null;
  registered_at: string;
  /** IANA или null, если в БД нет поля */
  executor_timezone: string | null;
  stats: {
    active_tasks_without_report: number;
    completed_tasks_with_report: number;
    executor_self_cancellations: number;
  };
  worked_with_this_employer: boolean;
}

export interface Location {
  address: string;
  city: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface Order {
  id: string;
  offerId: string;
  offer: Offer;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: string;
  completedAt?: string;
  rating?: number;
  review?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface FilterOptions {
  category?: string;
  priceRange?: {
    min: number;
    max: number;
  };
  rating?: number;
  location?: string;
  tags?: string[];
}

export interface SortOptions {
  field: 'price' | 'rating' | 'createdAt' | 'title';
  direction: 'asc' | 'desc';
}

export interface SearchParams {
  query?: string;
  filters?: FilterOptions;
  sort?: SortOptions;
  page?: number;
  limit?: number;
}

export interface FavoriteOfferSummary {
  id: string;
  available: boolean;
  title: string;
  description: string;
  price: string;
  location: string;
  image_alt_text?: string;
  is_promo: boolean;
  start_date: string;
  end_date: string;
  employer_company: string;
}

export interface AddToFavoritesResponse {
  success: true;
  data: {
    offer_id: string;
    message: string;
  }
}

export interface RemoveFromFavoritesResponse {
  success: true;
  data: {
    offer_id: string;
    message: string;
  }
}

export interface UserStatistics {
  user_id: string;
  name: string;
  surname: string;
  email: string;
  phone: string;
  total_applications: number;
  approved_applications: number;
  in_progress_applications: number;
  completed_applications: number;
  total_earnings: number;
  average_rating: number;
  favourite_offers_count: number;
}

export interface UserStatisticsResponse {
  success: true;
  data: UserStatistics;
}

export interface FavoriteStatusResponse {
  success: true;
  data: {
    offer_id: string;
    is_favorite: boolean;
  }
}

export interface ApplyResponse {
  success: true;
  data: {
    application_id: string;
    offer_id: string;
    user_id: string;
    applied_at: string;
    approved_at?: string;
    approved_by?: string;
  }
}

export interface Application {
  application_id: string;
  offer_id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'done' | 'in_progress' | 'completed' | 'cancelled' | string;
  applied_at: string;
  approved_at?: string;
  has_report?: boolean;
  employer_decision_comment?: string;
  report_status?: ApiReportStatus | string;
  employer_review_comment?: string;
  can_resubmit?: boolean;
  /** Исполнитель уже отправил единственную доработку отчёта */
  resubmit_used?: boolean;
}

export interface ApplicationsResponse {
  success: true;
  data: Application[];
  meta?: { cancelled_count?: number };
}
