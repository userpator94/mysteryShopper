import './style.css'
import { router } from './router/index.js'
import { createLayout } from './components/Layout.js'
import { createHomePage } from './pages/HomePage.js'
import { createOffersListPage } from './pages/OffersListPage.js'
import { createOfferDetailPage } from './pages/OfferDetailPage.js'
import { createFavoritesPage } from './pages/FavoritesPage.js'
import { createProfilePage } from './pages/ProfilePage.js'
import { createOrderHistoryPage } from './pages/OrderHistoryPage.js'

// Создаем основной layout
const app = document.querySelector<HTMLDivElement>('#app')!
const layout = createLayout()
app.appendChild(layout)

// Настраиваем роутер
const mainContent = document.getElementById('main-content')!
router.setContainer(mainContent)

// Добавляем маршруты
router.addRoute({
  path: '/',
  component: createHomePage,
  title: 'Главная'
})

router.addRoute({
  path: '/offers',
  component: createOffersListPage,
  title: 'Предложения'
})

router.addRoute({
  path: '/offers/:id',
  component: () => {
    const pathParts = window.location.pathname.split('/')
    const offerId = pathParts[pathParts.length - 1]
    return createOfferDetailPage(offerId)
  },
  title: 'Детали предложения'
})

router.addRoute({
  path: '/favorites',
  component: createFavoritesPage,
  title: 'Избранное'
})

router.addRoute({
  path: '/profile',
  component: createProfilePage,
  title: 'Профиль'
})

router.addRoute({
  path: '/orders',
  component: createOrderHistoryPage,
  title: 'История заказов'
})

// Обработка hash-роутинга для совместимости
window.addEventListener('hashchange', () => {
  const hash = window.location.hash.substring(1)
  if (hash) {
    router.navigate(hash)
  }
})

// Инициализация приложения
if (window.location.hash) {
  const hash = window.location.hash.substring(1)
  router.navigate(hash)
} else {
  router.navigate('/')
}
