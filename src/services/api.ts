// Сервис для работы с API
import type { Offer, SearchParams, FavoriteOfferSummary, AddToFavoritesResponse, RemoveFromFavoritesResponse, UserStatisticsResponse, FavoriteStatusResponse, ApplyResponse, ApplicationsResponse, Application, MeUser, CreateOfferPayload, UpdateOfferPayload, UserRole, EmployerReportListItem } from '../types/index.js';
import { devLog } from '../utils/logger.js';
import { setRole, clearRole } from '../utils/auth.js';

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

  // Вспомогательный метод для безопасного парсинга JSON ответа
  private async parseResponse(response: Response): Promise<any> {
    // Читаем текст ответа один раз
    const text = await response.text();
    
    // Если ответ пустой, возвращаем пустой объект
    if (!text.trim()) {
      return {};
    }
    
    // Проверяем, не является ли ответ HTML/XML (даже если Content-Type говорит, что это JSON)
    const trimmedText = text.trim().toLowerCase();
    if (trimmedText.startsWith('<') || 
        trimmedText.includes('<!doctype') || 
        trimmedText.includes('<html') || 
        trimmedText.includes('<document') ||
        trimmedText.startsWith('<?xml')) {
      throw new Error('На сервере в данный момент проходят технические работы. Пожалуйста, вернитесь позже.');
    }
    
    // Проверяем Content-Type для дополнительной валидации
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json') && text.trim()) {
      // Если Content-Type не JSON, но текст не пустой и не HTML, все равно пробуем распарсить
      // (на случай, если сервер неправильно установил Content-Type)
    }
    
    // Пытаемся распарсить JSON
    try {
      return JSON.parse(text);
    } catch (error: any) {
      // Если парсинг JSON не удался, значит ответ некорректный
      throw new Error('На сервере в данный момент проходят технические работы. Пожалуйста, вернитесь позже.');
    }
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
        devLog.log('Используем кэшированные данные для:', url);
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

    devLog.log('Выполняем API запрос:', url);
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
      try {
        const errorData = await this.parseResponse(response);
        const errorMessage = errorData.error?.message || errorData.message || `API request failed: ${response.status} ${response.statusText}`;
        const err = new Error(errorMessage);
        (err as any).code = errorData.error?.code;
        throw err;
      } catch (error: any) {
        if (error.message && error.message.includes('технические работы')) {
          throw error;
        }
        // Сообщение от бэкенда (например VALIDATION_ERROR) — пробрасываем как есть
        if (error.message && !error.message.startsWith('API request failed')) {
          throw error;
        }
        throw new Error(`Ошибка запроса: ${response.status} ${response.statusText}`);
      }
    }
    
    const data = await this.parseResponse(response);
    
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
      devLog.log('Используем кэшированные данные для:', url);
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

      devLog.log('Выполняем API запрос:', url);
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
        devLog.log('404 ошибка при загрузке избранного - возвращаем пустой массив');
        return [];
      }
      
      if (!response.ok) {
        try {
          const errorData = await this.parseResponse(response);
          const errorMessage = errorData.error?.message || `API request failed: ${response.status} ${response.statusText}`;
          throw new Error(errorMessage);
        } catch (error: any) {
          // Если ошибка уже содержит наше сообщение о технических работах, пробрасываем её
          if (error.message && error.message.includes('технические работы')) {
            throw error;
          }
          // Иначе пробуем стандартную обработку
          throw new Error(`Ошибка запроса: ${response.status} ${response.statusText}`);
        }
      }
      
      const data = await this.parseResponse(response);
      const favorites = data.data || [];
      
      // Кэшируем результат
      this.cache.set(url, { data, timestamp: Date.now() });
      
      return favorites;
    } catch (error: any) {
      // Если ошибка 404 в сообщении, возвращаем пустой массив
      const errorMessage = error?.message || '';
      if (errorMessage.includes('404') || error?.status === 404 || errorMessage.includes('Not Found')) {
        devLog.log('404 ошибка при загрузке избранного - возвращаем пустой массив');
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

      devLog.log('Запрос к API:', url);
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });
      
      devLog.log('Статус ответа:', response.status);
      
      if (response.status === 200) {
        const data = await this.parseResponse(response);
        devLog.log('Полный ответ API:', data);
        
        // Проверяем разные возможные структуры ответа
        if (data && data.success && data.data) {
          // Стандартная структура { success: true, data: [...] }
          if (Array.isArray(data.data) && data.data.length > 0) {
            devLog.log('Заявка найдена в массиве:', data.data[0]);
            return data.data[0];
          }
          // Возможно data - это объект, а не массив
          if (data.data && typeof data.data === 'object' && !Array.isArray(data.data)) {
            devLog.log('Заявка найдена как объект:', data.data);
            return data.data;
          }
        }
        // Если структура другая, пробуем напрямую
        if (Array.isArray(data) && data.length > 0) {
          devLog.log('Заявка найдена (массив напрямую):', data[0]);
          return data[0];
        }
        if (data && data.application_id) {
          devLog.log('Заявка найдена (объект напрямую):', data);
          return data;
        }
      }
      
      devLog.log('Заявка не найдена, статус:', response.status);
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

      devLog.log('Отказ от заявки, запрос к API:', url);
      const response = await fetch(url, {
        method: 'PUT',
        headers,
      });
      
      devLog.log('Статус ответа при отказе:', response.status);
      
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

    // Используем безопасный парсинг ответа
    const data = await this.parseResponse(response);

    if (!response.ok || !data.success) {
      const error: any = new Error(data.error?.message || `Login failed: ${response.status} ${response.statusText}`);
      error.code = data.error?.code;
      error.field = data.error?.field;
      throw error;
    }

    // Сохраняем токен и роль в localStorage
    if (data.success && data.data?.token) {
      localStorage.setItem('auth_token', data.data.token);
      localStorage.setItem('user_id', data.data.user?.id?.toString() || '');
      const role = data.data.user?.role;
      if (role === 'user' || role === 'employer') setRole(role);
    }

    return data;
  }

  public async signup(
    name: string,
    lastname: string,
    email: string,
    phone: string,
    password: string,
    options?: { role?: UserRole; company?: string; description?: string; website?: string }
  ): Promise<{ success: boolean; data: { token: string; user: any; expiresIn: number } }> {
    const url = `${API_BASE_URL}/signup`;
    const body: Record<string, unknown> = { name, lastname, email, phone, password };
    if (options?.role) body.role = options.role;
    if (options?.company !== undefined) body.company = options.company;
    if (options?.description !== undefined) body.description = options.description;
    if (options?.website !== undefined) body.website = options.website;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await this.parseResponse(response);

    if (!response.ok || !data.success) {
      const error: any = new Error(data.error?.message || `Signup failed: ${response.status} ${response.statusText}`);
      error.code = data.error?.code;
      error.field = data.error?.field;
      error.errors = data.error?.errors;
      throw error;
    }

    if (data.success && data.data?.token) {
      localStorage.setItem('auth_token', data.data.token);
      localStorage.setItem('user_id', data.data.user?.id?.toString() || '');
      const role = data.data.user?.role;
      if (role === 'user' || role === 'employer') setRole(role);
    }

    return data;
  }

  /** GET /api/me — профиль текущего пользователя (роль, для employer — company и т.д.) */
  public async getMe(): Promise<{ success: boolean; data: MeUser }> {
    const data = await this.request<{ success: boolean; data: MeUser }>('/me');
    if (data.data?.role === 'user' || data.data?.role === 'employer') {
      setRole(data.data.role);
    }
    return data;
  }

  /** GET /api/my/offers — офферы текущего заказчика (только employer) */
  public async getMyOffers(params?: { page?: number; limit?: number }): Promise<Offer[]> {
    const query = new URLSearchParams();
    if (params?.page != null) query.set('page', String(params.page));
    if (params?.limit != null) query.set('limit', String(params.limit));
    const endpoint = query.toString() ? `/my/offers?${query}` : '/my/offers';
    const response = await this.request<{ success: boolean; data: Offer[] }>(endpoint);
    return response.data ?? [];
  }

  /** POST /api/offers — создание оффера (только employer) */
  public async createOffer(payload: CreateOfferPayload): Promise<Offer> {
    const response = await this.request<{ success: boolean; data: Offer }>('/offers', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return response.data;
  }

  /** PATCH /api/offers/:id — редактирование оффера (владелец) */
  public async updateOffer(offerId: string, payload: UpdateOfferPayload): Promise<Offer> {
    const response = await this.request<{ success: boolean; data: Offer }>(`/offers/${offerId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return response.data;
  }

  /** DELETE /api/offers/:id — удаление/деактивация оффера (владелец) */
  public async deleteOffer(offerId: string): Promise<void> {
    await this.request(`/offers/${offerId}`, { method: 'DELETE' });
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
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_id');
      clearRole();
      this.clearCache();
    }
  }

  /** Отчёт: стандарт (рейтинг + текст + фото) или кастомный чек-лист */
  public async submitReport(params: {
    applicationId: string;
    offerId: string;
    userId: string;
    feedback: Record<string, unknown>;
    photos: File[];
    rating?: number;
    checklistAnswers?: Record<string, unknown> | null;
  }): Promise<{ success: boolean; data: any }> {
    const url = `${API_BASE_URL}/report`;
    const { applicationId, offerId, userId, feedback, photos, rating, checklistAnswers } = params;

    const formData = new FormData();
    formData.append('application_id', applicationId);
    formData.append('offer_id', offerId);
    formData.append('user_id', userId);
    formData.append('feedback', JSON.stringify(feedback));
    if (checklistAnswers != null) {
      formData.append('checklist_answers', JSON.stringify(checklistAnswers));
    } else if (rating !== undefined) {
      formData.append('rating', String(rating));
    }
    photos.forEach((file) => {
      formData.append('photos', file);
    });

    // Получаем токен
    const token = this.getAuthToken();
    if (!token) {
      throw new Error('Токен авторизации не найден');
    }

    devLog.log('Отправка отчёта на:', url);
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
      try {
        const errorData = await this.parseResponse(response);
        const errorMessage = errorData.error?.message || `Ошибка отправки отчёта: ${response.status} ${response.statusText}`;
        throw new Error(errorMessage);
      } catch (error: any) {
        // Если ошибка уже содержит наше сообщение о технических работах, пробрасываем её
        if (error.message && error.message.includes('технические работы')) {
          throw error;
        }
        // Иначе пробуем стандартную обработку
        throw new Error(`Ошибка отправки отчёта: ${response.status} ${response.statusText}`);
      }
    }

    const data = await this.parseResponse(response);
    return data;
  }

  /** Список отчётов по офферу (заказчик) */
  public async getEmployerOfferReports(
    offerId: string,
    sortBy: 'submitted_at' | 'task_completed_at' = 'submitted_at'
  ): Promise<EmployerReportListItem[]> {
    const q = new URLSearchParams({ sortBy });
    const response = await this.request<{ success: boolean; data: EmployerReportListItem[] }>(
      `/offers/${offerId}/reports?${q}`
    );
    return response.data ?? [];
  }

  /** Один отчёт для заказчика */
  public async getEmployerOfferReport(offerId: string, reportId: string): Promise<EmployerReportListItem> {
    const response = await this.request<{ success: boolean; data: EmployerReportListItem }>(
      `/offers/${offerId}/reports/${reportId}`
    );
    return response.data;
  }
}

export const apiService = ApiService.getInstance();
