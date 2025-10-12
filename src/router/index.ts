// Простой роутер для SPA приложения

export interface Route {
  path: string;
  component: () => Promise<HTMLElement>;
  title: string;
}

class Router {
  private routes: Route[] = [];
  private currentRoute: Route | null = null;
  private container: HTMLElement | null = null;
  private isInitialized = false;

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
    window.location.hash = path;
    // Не вызываем handleRoute() здесь - это будет сделано через событие hashchange
  }

  private async handleRoute() {
    const hash = window.location.hash.substring(1) || '/';
    const [path] = hash.split('?');
    const route = this.findMatchingRoute(path);
    
    // Проверяем, что это действительно новый маршрут
    if (route && this.container && route !== this.currentRoute) {
      this.currentRoute = route;
      document.title = `${route.title} - Mystery Shopper`;
      
      try {
        const component = await route.component();
        this.container.innerHTML = '';
        this.container.appendChild(component);
        
        // Прокручиваем к верху страницы
        window.scrollTo(0, 0);
      } catch (error) {
        console.error('Error loading route:', error);
        this.container.innerHTML = '<div class="error">Страница не найдена</div>';
      }
    }
  }

  private findMatchingRoute(path: string): Route | null {
    // Сначала ищем точное совпадение
    const exactMatch = this.routes.find(r => r.path === path);
    if (exactMatch) return exactMatch;

    // Затем ищем маршруты с параметрами
    for (const route of this.routes) {
      if (route.path.includes(':')) {
        const routePattern = route.path.replace(/:[^/]+/g, '[^/]+');
        const regex = new RegExp(`^${routePattern}$`);
        if (regex.test(path)) {
          return route;
        }
      }
    }

    // Если ничего не найдено, возвращаем главную страницу
    return this.routes.find(r => r.path === '/') || null;
  }

  getCurrentRoute(): Route | null {
    return this.currentRoute;
  }

  getQueryParams(): URLSearchParams {
    const hash = window.location.hash.substring(1) || '/';
    const [, queryString] = hash.split('?');
    return new URLSearchParams(queryString || '');
  }

  // Метод для инициализации роутера после добавления всех маршрутов
  initialize() {
    if (!this.isInitialized) {
      this.isInitialized = true;
      this.handleRoute();
    }
  }
}

export const router = new Router();
