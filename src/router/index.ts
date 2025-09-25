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

  constructor() {
    this.init();
  }

  private init() {
    window.addEventListener('popstate', () => this.handleRoute());
    window.addEventListener('hashchange', () => this.handleRoute());
    this.handleRoute();
  }

  addRoute(route: Route) {
    this.routes.push(route);
  }

  setContainer(container: HTMLElement) {
    this.container = container;
  }

  navigate(path: string) {
    window.location.hash = path;
    this.handleRoute();
  }

  private async handleRoute() {
    const hash = window.location.hash.substring(1) || '/';
    const [path] = hash.split('?');
    const route = this.findMatchingRoute(path);
    
    if (route && this.container) {
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
}

export const router = new Router();
