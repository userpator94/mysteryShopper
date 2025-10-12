// Основные типы данных для приложения

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
  tags: string;
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
