// Сервис для работы с API
import type { Offer, SearchParams, FavoriteOfferSummary, AddToFavoritesResponse, RemoveFromFavoritesResponse, UserStatisticsResponse, FavoriteStatusResponse } from '../types/index.js';

const API_BASE_URL = '/api';
const DEV_USER_ID = '1416fac6-6954-4d49-a35c-684ead433361'; // Hardcoded user ID for development

export class ApiService {
  private static instance: ApiService;
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_DURATION = 30000; // 30 секунд
  
  private constructor() {}
  
  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  // Метод для очистки кэша
  public clearCache(pattern?: string): void {
    if (pattern) {
      // Очищаем только записи, соответствующие паттерну
      const urlPattern = `${API_BASE_URL}${pattern}`;
      for (const key of this.cache.keys()) {
        if (key.includes(urlPattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      // Очищаем весь кэш
      this.cache.clear();
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Проверяем кэш для GET запросов
    if (!options.method || options.method === 'GET') {
      const cached = this.cache.get(url);
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        console.log('Используем кэшированные данные для:', url);
        return cached.data;
      }
    }
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': DEV_USER_ID,
        ...options.headers,
      },
    };

    console.log('Выполняем API запрос:', url);
    const response = await fetch(url, { ...defaultOptions, ...options });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Кэшируем результат для GET запросов
    if (!options.method || options.method === 'GET') {
      this.cache.set(url, { data, timestamp: Date.now() });
    }
    
    return data;
  }

  public async getOffers(params?: SearchParams): Promise<Offer[]> {
    const searchParams = new URLSearchParams();
    
    if (params?.query) {
      searchParams.append('query', params.query);
    }
    
    if (params?.filters?.category) {
      searchParams.append('category', params.filters.category);
    }
    
    if (params?.filters?.priceRange) {
      searchParams.append('minPrice', params.filters.priceRange.min.toString());
      searchParams.append('maxPrice', params.filters.priceRange.max.toString());
    }
    
    if (params?.filters?.rating) {
      searchParams.append('minRating', params.filters.rating.toString());
    }
    
    if (params?.sort) {
      searchParams.append('sortBy', params.sort.field);
      searchParams.append('sortOrder', params.sort.direction);
    }
    
    if (params?.page) {
      searchParams.append('page', params.page.toString());
    }
    
    if (params?.limit) {
      searchParams.append('limit', params.limit.toString());
    }

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/offers?${queryString}` : '/offers';
    
    const response = await this.request<{ success: boolean; data: Offer[] }>(endpoint);
    return response.data;
  }

  public async getOfferById(id: string): Promise<Offer> {
    const response = await this.request<{ success: boolean; data: Offer }>(`/offers/${id}`);
    return response.data;
  }

  public async toggleFavorite(offerId: string): Promise<{ isFavorite: boolean }> {
    return this.request<{ isFavorite: boolean }>(`/offers/${offerId}/favorite`, {
      method: 'POST',
    });
  }

  public async getFavorites(): Promise<FavoriteOfferSummary[]> {
    try {
      const response = await this.request<{ success: boolean; data: FavoriteOfferSummary[] }>('/favorites');
      return response.data;
    } catch (error: any) {
      // Если ошибка 404, возвращаем пустой массив (нет избранных предложений)
      if (error?.message?.includes('404') || error?.status === 404) {
        return [];
      }
      // Для других ошибок пробрасываем исключение
      throw error;
    }
  }

  public async addToFavorites(offerId: string): Promise<{ response: AddToFavoritesResponse; statusCode: number }> {
    const url = `${API_BASE_URL}/favorites`;
    
    const defaultOptions: RequestInit = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': DEV_USER_ID,
      },
      body: JSON.stringify({ offer_id: offerId }),
    };

    console.log('Выполняем API запрос:', url);
    const response = await fetch(url, defaultOptions);
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    return {
      response: data,
      statusCode: response.status
    };
  }

  public async removeFromFavorites(offerId: string): Promise<{ response: RemoveFromFavoritesResponse; statusCode: number }> {
    const url = `${API_BASE_URL}/favorites/${offerId}`;
    
    const defaultOptions: RequestInit = {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': DEV_USER_ID,
      },
    };

    console.log('Выполняем API запрос:', url);
    const response = await fetch(url, defaultOptions);
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    return {
      response: data,
      statusCode: response.status
    };
  }

  public async getUserStatistics(): Promise<UserStatisticsResponse> {
    return this.request<UserStatisticsResponse>('/user/stats', {
      method: 'POST',
    });
  }

  public async checkFavoriteStatus(offerId: string): Promise<FavoriteStatusResponse> {
    return this.request<FavoriteStatusResponse>(`/favorites?offer_id=${offerId}`);
  }

  // Аутентификация
  public async login(email: string, password: string): Promise<{ success: boolean; data: { token: string; user: any; expiresIn: number } }> {
    const url = `${API_BASE_URL}/login`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      const error: any = new Error(data.error?.message || `Login failed: ${response.status} ${response.statusText}`);
      error.code = data.error?.code;
      error.field = data.error?.field;
      throw error;
    }

    // Сохраняем токен в localStorage
    if (data.success && data.data?.token) {
      localStorage.setItem('auth_token', data.data.token);
      localStorage.setItem('user_id', data.data.user?.id?.toString() || '');
    }

    return data;
  }

  public async signup(name: string, lastname: string, email: string, phone: string, password: string): Promise<{ success: boolean; data: { token: string; user: any; expiresIn: number } }> {
    const url = `${API_BASE_URL}/signup`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, lastname, email, phone, password }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      const error: any = new Error(data.error?.message || `Signup failed: ${response.status} ${response.statusText}`);
      error.code = data.error?.code;
      error.field = data.error?.field;
      error.errors = data.error?.errors; // Массив ошибок для множественной валидации
      throw error;
    }

    // Сохраняем токен в localStorage
    if (data.success && data.data?.token) {
      localStorage.setItem('auth_token', data.data.token);
      localStorage.setItem('user_id', data.data.user?.id?.toString() || '');
    }

    return data;
  }
}

export const apiService = ApiService.getInstance();
