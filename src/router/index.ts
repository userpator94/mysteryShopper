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
    this.handleRoute();
  }

  addRoute(route: Route) {
    this.routes.push(route);
  }

  setContainer(container: HTMLElement) {
    this.container = container;
  }

  navigate(path: string) {
    window.history.pushState({}, '', path);
    this.handleRoute();
  }

  private async handleRoute() {
    const path = window.location.pathname;
    const route = this.routes.find(r => r.path === path) || this.routes.find(r => r.path === '/');
    
    if (route && this.container) {
      this.currentRoute = route;
      document.title = `${route.title} - Mystery Shopper`;
      
      try {
        const component = await route.component();
        this.container.innerHTML = '';
        this.container.appendChild(component);
      } catch (error) {
        console.error('Error loading route:', error);
        this.container.innerHTML = '<div class="error">Страница не найдена</div>';
      }
    }
  }

  getCurrentRoute(): Route | null {
    return this.currentRoute;
  }
}

export const router = new Router();
