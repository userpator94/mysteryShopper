// Сервис для работы с API
import type { Offer, SearchParams, FavoriteOfferSummary, AddToFavoritesResponse, RemoveFromFavoritesResponse, UserStatisticsResponse, FavoriteStatusResponse, ApplyResponse, ApplicationsResponse, Application } from '../types/index.js';

const API_BASE_URL = '/api';

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

  // Метод для получения токена из localStorage
  private getAuthToken(): string | null {
    return localStorage.getItem('auth_token');
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

  private async request<T>(endpoint: string, options: RequestInit = {}, requireAuth: boolean = true): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Проверяем кэш для GET запросов
    if (!options.method || options.method === 'GET') {
      const cached = this.cache.get(url);
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        console.log('Используем кэшированные данные для:', url);
        return cached.data;
      }
    }
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Добавляем существующие заголовки
    if (options.headers) {
      if (options.headers instanceof Headers) {
        options.headers.forEach((value, key) => {
          headers[key] = value;
        });
      } else if (Array.isArray(options.headers)) {
        options.headers.forEach(([key, value]) => {
          headers[key] = value;
        });
      } else {
        Object.assign(headers, options.headers);
      }
    }

    // Добавляем JWT токен для защищенных запросов
    if (requireAuth) {
      const token = this.getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    const defaultOptions: RequestInit = {
      headers,
      ...options,
    };

    console.log('Выполняем API запрос:', url);
    const response = await fetch(url, defaultOptions);
    
    // Обработка ошибок аутентификации
    if (response.status === 401) {
      // Токен невалиден или истек - удаляем его и перенаправляем на логин
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_id');
      window.location.href = '/login';
      throw new Error('Токен авторизации невалиден или истек');
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || `API request failed: ${response.status} ${response.statusText}`;
      throw new Error(errorMessage);
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
    
    // GET /api/offers - публичный эндпоинт, не требует аутентификации
    const response = await this.request<{ success: boolean; data: Offer[] }>(endpoint, {}, false);
    return response.data;
  }

  public async getOfferById(id: string): Promise<Offer> {
    // GET /api/offers/:id - требует аутентификации
    const response = await this.request<{ success: boolean; data: Offer }>(`/offers/${id}`);
    return response.data;
  }

  public async toggleFavorite(offerId: string): Promise<{ isFavorite: boolean }> {
    return this.request<{ isFavorite: boolean }>(`/offers/${offerId}/favorite`, {
      method: 'POST',
    });
  }

  public async getFavorites(): Promise<FavoriteOfferSummary[]> {
    const url = `${API_BASE_URL}/favorites`;
    
    // Проверяем кэш
    const cached = this.cache.get(url);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log('Используем кэшированные данные для:', url);
      return (cached.data as any)?.data || [];
    }
    
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Добавляем JWT токен
      const token = this.getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      console.log('Выполняем API запрос:', url);
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });
      
      // Обработка ошибок аутентификации
      if (response.status === 401) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_id');
        window.location.href = '/login';
        throw new Error('Токен авторизации невалиден или истек');
      }
      
      // Если 404 - возвращаем пустой массив (нет избранных)
      if (response.status === 404) {
        console.log('404 ошибка при загрузке избранного - возвращаем пустой массив');
        return [];
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || `API request failed: ${response.status} ${response.statusText}`;
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      const favorites = data.data || [];
      
      // Кэшируем результат
      this.cache.set(url, { data, timestamp: Date.now() });
      
      return favorites;
    } catch (error: any) {
      // Если ошибка 404 в сообщении, возвращаем пустой массив
      const errorMessage = error?.message || '';
      if (errorMessage.includes('404') || error?.status === 404 || errorMessage.includes('Not Found')) {
        console.log('404 ошибка при загрузке избранного - возвращаем пустой массив');
        return [];
      }
      // Для других ошибок пробрасываем исключение
      throw error;
    }
  }

  public async addToFavorites(offerId: string): Promise<{ response: AddToFavoritesResponse; statusCode: number }> {
    return this.request<AddToFavoritesResponse>('/favorites', {
      method: 'POST',
      body: JSON.stringify({ offer_id: offerId }),
    }).then((data) => ({
      response: data,
      statusCode: 200
    }));
  }

  public async removeFromFavorites(offerId: string): Promise<{ response: RemoveFromFavoritesResponse; statusCode: number }> {
    return this.request<RemoveFromFavoritesResponse>(`/favorites/${offerId}`, {
      method: 'DELETE',
    }).then((data) => ({
      response: data,
      statusCode: 200
    }));
  }

  public async getUserStatistics(): Promise<UserStatisticsResponse> {
    return this.request<UserStatisticsResponse>('/user/stats', {
      method: 'POST',
    });
  }

  public async checkFavoriteStatus(offerId: string): Promise<FavoriteStatusResponse> {
    return this.request<FavoriteStatusResponse>(`/favorites?offer_id=${offerId}`);
  }

  public async apply(offerId: string): Promise<ApplyResponse> {
    return this.request<ApplyResponse>('/apply', {
      method: 'POST',
      body: JSON.stringify({ offer_id: offerId }),
    });
  }

  public async getApplies(): Promise<ApplicationsResponse> {
    return this.request<ApplicationsResponse>('/applies');
  }

  public async getApplyByOfferId(offerId: string): Promise<Application | null> {
    try {
      const url = `${API_BASE_URL}/applies?offer_id=${offerId}`;
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Добавляем JWT токен
      const token = this.getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      console.log('Запрос к API:', url);
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });
      
      console.log('Статус ответа:', response.status);
      
      if (response.status === 200) {
        const data = await response.json();
        console.log('Полный ответ API:', data);
        
        // Проверяем разные возможные структуры ответа
        if (data && data.success && data.data) {
          // Стандартная структура { success: true, data: [...] }
          if (Array.isArray(data.data) && data.data.length > 0) {
            console.log('Заявка найдена в массиве:', data.data[0]);
            return data.data[0];
          }
          // Возможно data - это объект, а не массив
          if (data.data && typeof data.data === 'object' && !Array.isArray(data.data)) {
            console.log('Заявка найдена как объект:', data.data);
            return data.data;
          }
        }
        // Если структура другая, пробуем напрямую
        if (Array.isArray(data) && data.length > 0) {
          console.log('Заявка найдена (массив напрямую):', data[0]);
          return data[0];
        }
        if (data && data.application_id) {
          console.log('Заявка найдена (объект напрямую):', data);
          return data;
        }
      }
      
      console.log('Заявка не найдена, статус:', response.status);
      return null;
    } catch (error) {
      console.error('Ошибка при получении заявки:', error);
      return null;
    }
  }

  public async cancelApply(offerId: string): Promise<boolean> {
    try {
      const url = `${API_BASE_URL}/apply?offer_id=${offerId}`;
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Добавляем JWT токен
      const token = this.getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      console.log('Отказ от заявки, запрос к API:', url);
      const response = await fetch(url, {
        method: 'PUT',
        headers,
      });
      
      console.log('Статус ответа при отказе:', response.status);
      
      return response.status === 200;
    } catch (error) {
      console.error('Ошибка при отказе от заявки:', error);
      return false;
    }
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

  // Метод для выхода
  public async logout(): Promise<void> {
    try {
      // Вызываем эндпоинт /api/logout с JWT токеном
      await this.request<{ success: boolean; data: { message: string } }>('/logout', {
        method: 'POST',
      }, true);
    } catch (error) {
      // Даже если запрос завершился с ошибкой, очищаем localStorage
      console.error('Ошибка при выходе:', error);
    } finally {
      // Удаляем токен из localStorage после успешного или неуспешного выхода
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_id');
      // Очищаем кэш
      this.clearCache();
    }
  }

  public async submitReport(
    applicationId: string,
    offerId: string,
    userId: string,
    rating: number,
    feedback: object,
    photos: File[]
  ): Promise<{ success: boolean; data: any }> {
    const url = `${API_BASE_URL}/report`;
    
    // Создаём FormData
    const formData = new FormData();
    formData.append('application_id', applicationId);
    formData.append('offer_id', offerId);
    formData.append('user_id', userId);
    formData.append('rating', rating.toString());
    formData.append('feedback', JSON.stringify(feedback));
    
    // Добавляем файлы
    photos.forEach((file) => {
      formData.append('photos', file);
    });

    // Получаем токен
    const token = this.getAuthToken();
    if (!token) {
      throw new Error('Токен авторизации не найден');
    }

    console.log('Отправка отчёта на:', url);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // НЕ указываем Content-Type - браузер установит автоматически с boundary
      },
      body: formData,
    });

    // Обработка ошибок аутентификации
    if (response.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_id');
      window.location.href = '/login';
      throw new Error('Токен авторизации невалиден или истек');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || `Ошибка отправки отчёта: ${response.status} ${response.statusText}`;
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;
  }
}

export const apiService = ApiService.getInstance();
