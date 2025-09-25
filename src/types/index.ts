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
  title: string;
  description: string;
  price: number;
  currency: string;
  images: string[];
  videos?: string[];
  location: Location;
  category: string;
  rating: number;
  reviewsCount: number;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
  conditions: string[];
  tags: string[];
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
