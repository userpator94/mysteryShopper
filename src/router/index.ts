// Простой роутер для SPA приложения

export interface Route {
  path: string;
  component: () => Promise<HTMLElement>;
  title: string;
  requiresAuth?: boolean; // Требует ли маршрут аутентификации
}

class Router {
  private routes: Route[] = [];
  private currentRoute: Route | null = null;
  private container: HTMLElement | null = null;
  private isInitialized = false;
  private isHandlingRoute = false; // Флаг для предотвращения рекурсии

  constructor() {
    this.init();
  }

  private init() {
    window.addEventListener('popstate', () => this.handleRoute());
    window.addEventListener('hashchange', () => this.handleRoute());
    // Не вызываем handleRoute() сразу - это будет сделано в main.ts
  }

  addRoute(route: Route) {
    this.routes.push(route);
  }

  setContainer(container: HTMLElement) {
    this.container = container;
  }

  navigate(path: string) {
    // Используем History API для чистых URL, но также поддерживаем hash
    if (path.startsWith('/')) {
      window.history.pushState(null, '', path);
      this.handleRoute();
    } else {
      window.location.hash = path;
    }
  }

  private getCurrentPath(): string {
    // Сначала проверяем hash (для обратной совместимости)
    const hash = window.location.hash.substring(1);
    if (hash) {
      return hash;
    }
    // Если hash пустой, используем pathname
    return window.location.pathname || '/';
  }

  private async handleRoute() {
    // Защита от рекурсии
    if (this.isHandlingRoute) {
      return;
    }
    
    this.isHandlingRoute = true;
    
    try {
      const path = this.getCurrentPath();
      const [cleanPath] = path.split('?');
      const route = this.findMatchingRoute(cleanPath);
      
      // Если маршрут не найден, показываем 404 только если это не главная страница
      if (!route) {
        if (this.container && cleanPath !== '/') {
          this.container.innerHTML = '<div class="error">Страница не найдена</div>';
        } else if (cleanPath === '/' || cleanPath === '') {
          // Если корневой путь не найден, редиректим на login
          this.isHandlingRoute = false;
          this.navigate('/login');
        } else {
          this.isHandlingRoute = false;
        }
        return;
      }
      
      // Проверяем аутентификацию для защищенных маршрутов
      if (route.requiresAuth) {
        const { isAuthenticated } = await import('../utils/auth.js');
        if (!isAuthenticated()) {
          // Пользователь не авторизован - перенаправляем на страницу входа
          // Используем router.navigate для SPA навигации
          if (cleanPath !== '/login') {
            this.isHandlingRoute = false;
            this.navigate('/login');
          } else {
            this.isHandlingRoute = false;
          }
          return;
        }
      }
      
      // Проверяем, что контейнер установлен
      if (!this.container) {
        console.error('Router container is not set');
        return;
      }
      
      // Проверяем, что это действительно новый маршрут
      if (route) {
        // Проверяем, изменился ли маршрут (сравниваем по path, а не по объекту)
        const currentPath = this.currentRoute?.path;
        const newPath = route.path;
        
        if (currentPath !== newPath) {
          this.currentRoute = route;
          document.title = `${route.title} - Mystery Shopper`;
          
          // Управляем видимостью footer
          this.updateFooterVisibility(cleanPath);
          
          try {
            const component = await route.component();
            if (this.container) {
              this.container.innerHTML = '';
              this.container.appendChild(component);
              
              // Прокручиваем к верху страницы
              window.scrollTo(0, 0);
            }
          } catch (error) {
            console.error('Error loading route:', error);
            if (this.container) {
              this.container.innerHTML = '<div class="error">Ошибка загрузки страницы</div>';
            }
          }
        }
      }
    } catch (error) {
      console.error('Error in handleRoute:', error);
      if (this.container) {
        this.container.innerHTML = '<div class="error">Ошибка маршрутизации</div>';
      }
    } finally {
      this.isHandlingRoute = false;
    }
  }

  private updateFooterVisibility(path: string) {
    // Импортируем функцию динамически, чтобы избежать циклических зависимостей
    import('../components/Layout.js').then(({ toggleFooter, shouldHideFooter }) => {
      const hideFooter = shouldHideFooter(path);
      toggleFooter(!hideFooter);
    }).catch(() => {
      // Если импорт не удался, используем прямой доступ к DOM
      const footer = document.getElementById('main-footer');
      const hiddenRoutes = ['/login', '/signup'];
      if (footer) {
        footer.style.display = hiddenRoutes.includes(path) ? 'none' : 'block';
      }
    });
  }

  private findMatchingRoute(path: string): Route | null {
    // Сначала ищем точное совпадение
    const exactMatch = this.routes.find(r => r.path === path);
    if (exactMatch) return exactMatch;

    // Затем ищем маршруты с параметрами (только если путь не пустой и не корневой)
    if (path !== '/' && path !== '') {
      for (const route of this.routes) {
        if (route.path.includes(':')) {
          const routePattern = route.path.replace(/:[^/]+/g, '[^/]+');
          const regex = new RegExp(`^${routePattern}$`);
          if (regex.test(path)) {
            return route;
          }
        }
      }
    }

    // Если путь корневой или пустой, возвращаем главную страницу
    if (path === '/' || path === '') {
      return this.routes.find(r => r.path === '/') || null;
    }

    // Если ничего не найдено, возвращаем null (не главную страницу!)
    return null;
  }

  getCurrentRoute(): Route | null {
    return this.currentRoute;
  }

  getQueryParams(): URLSearchParams {
    const path = this.getCurrentPath();
    const [, queryString] = path.split('?');
    return new URLSearchParams(queryString || '');
  }

  // Метод для инициализации роутера после добавления всех маршрутов
  initialize() {
    if (!this.isInitialized) {
      this.isInitialized = true;
      const path = this.getCurrentPath();
      const [cleanPath] = path.split('?');
      this.updateFooterVisibility(cleanPath);
      this.handleRoute();
    }
  }
}

export const router = new Router();
