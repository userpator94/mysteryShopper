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
  company?: string;
  description?: string;
  website?: string;
}

/** Элемент кастомного чек-листа (согласовано с API) */
export type ChecklistItemType = 'boolean' | 'scale_1_5' | 'text' | 'single_choice';

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

/** Тело запроса создания оффера (POST /api/offers). price — целое число (integer). */
export interface CreateOfferPayload {
  title: string;
  description: string;
  price: number;
  location: string;
  requirements: string;
  tags: string;
  start_date: string;
  end_date: string;
  max_participants: number;
  is_promo?: boolean;
  image_id?: string;
  /** null — стандартный отчёт; объект — кастомный чек-лист */
  checklist_schema?: ChecklistSchema | null;
  schema_version?: number;
}

/** Тело запроса обновления оффера (PATCH /api/offers/:id) — все поля опциональны. price — целое число. */
export interface UpdateOfferPayload {
  title?: string;
  description?: string;
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
  price: string;
  max_participants: number;
  current_participants: number;
  description: string;
  requirements: string;
  location: string;
  created_at: string;
  updated_at: string;
  employer_name: string;
  employer_surname: string;
  employer_company: string;
  image_url?: string;
  image_alt_text?: string;
  available_slots: number;
  /** API может вернуть string или string[] (например ["[задача", "сложная", "деньги]"]) */
  tags?: string | string[];
  checklist_schema?: ChecklistSchema | null;
  schema_version?: number;
  /** false — заказчик не может менять задачу (есть отчёт или заявка в работе). См. API */
  can_edit?: boolean;
}

/** Строка списка отчётов для заказчика (GET /api/offers/:id/reports) */
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
  executor_label: string;
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
}

export interface ApplicationsResponse {
  success: true;
  data: Application[];
}
