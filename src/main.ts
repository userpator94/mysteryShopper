import './style.css'
import { router } from './router/index.js'
import { createLayout } from './components/Layout.js'
import { createHomePage } from './pages/HomePage.js'
import { createOffersListPage } from './pages/OffersListPage.js'
import { createOfferDetailPage } from './pages/OfferDetailPage.js'
import { createFavoritesPage } from './pages/FavoritesPage.js'
import { createProfilePage } from './pages/ProfilePage.js'
import { createOrderHistoryPage } from './pages/OrderHistoryPage.js'
import { showWebDeviceModal } from './components/WebDeviceMessage.js'
import { detectDevice } from './utils/deviceDetection.js'

// Проверяем тип устройства
const app = document.querySelector<HTMLDivElement>('#app')!

if (!app) {
  throw new Error('App element not found')
}

// Создаем layout
const layout = createLayout()
app.appendChild(layout)

// Проверяем тип устройства и показываем модальное окно для веб-устройств
const device = detectDevice()
if (device.isDesktop) {
  showWebDeviceModal()
}

// Настраиваем роутер
const mainContent = document.getElementById('main-content')!

if (!mainContent) {
  throw new Error('Main content element not found')
}

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
    const hash = window.location.hash.substring(1)
    const pathParts = hash.split('/')
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

// Инициализация приложения
router.initialize()
