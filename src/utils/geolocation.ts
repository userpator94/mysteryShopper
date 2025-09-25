/**
 * Утилиты для работы с геолокацией и определением города
 */

export interface LocationInfo {
  city: string;
  region: string;
  country: string;
  latitude: number;
  longitude: number;
}

/**
 * Получает текущую геопозицию пользователя
 */
export function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Геолокация не поддерживается браузером'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => resolve(position),
      (error) => reject(error),
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 минут
      }
    );
  });
}

/**
 * Определяет город по координатам с помощью простого алгоритма
 */
export async function getCityByCoordinates(latitude: number, longitude: number): Promise<LocationInfo> {
  try {
    // Простой алгоритм определения города по координатам
    // Включает основные города России и международные города
    const cities = [
      // Российские города
      { name: 'Москва', lat: 55.7558, lon: 37.6176, region: 'Москва', country: 'Россия' },
      { name: 'Санкт-Петербург', lat: 59.9311, lon: 30.3609, region: 'Санкт-Петербург', country: 'Россия' },
      { name: 'Новосибирск', lat: 55.0084, lon: 82.9357, region: 'Новосибирская область', country: 'Россия' },
      { name: 'Екатеринбург', lat: 56.8431, lon: 60.6454, region: 'Свердловская область', country: 'Россия' },
      { name: 'Казань', lat: 55.8304, lon: 49.0661, region: 'Татарстан', country: 'Россия' },
      { name: 'Нижний Новгород', lat: 56.2965, lon: 43.9361, region: 'Нижегородская область', country: 'Россия' },
      { name: 'Челябинск', lat: 55.1644, lon: 61.4368, region: 'Челябинская область', country: 'Россия' },
      { name: 'Самара', lat: 53.2001, lon: 50.1500, region: 'Самарская область', country: 'Россия' },
      { name: 'Омск', lat: 54.9885, lon: 73.3242, region: 'Омская область', country: 'Россия' },
      { name: 'Ростов-на-Дону', lat: 47.2357, lon: 39.7015, region: 'Ростовская область', country: 'Россия' },
      { name: 'Уфа', lat: 54.7388, lon: 55.9721, region: 'Башкортостан', country: 'Россия' },
      { name: 'Красноярск', lat: 56.0184, lon: 92.8672, region: 'Красноярский край', country: 'Россия' },
      { name: 'Воронеж', lat: 51.6720, lon: 39.1843, region: 'Воронежская область', country: 'Россия' },
      { name: 'Пермь', lat: 58.0105, lon: 56.2502, region: 'Пермский край', country: 'Россия' },
      { name: 'Волгоград', lat: 48.7080, lon: 44.5133, region: 'Волгоградская область', country: 'Россия' },
      
      // Европейские города
      { name: 'Лиссабон', lat: 38.7223, lon: -9.1393, region: 'Лиссабон', country: 'Португалия' },
      { name: 'Порту', lat: 41.1579, lon: -8.6291, region: 'Порту', country: 'Португалия' },
      { name: 'Мадрид', lat: 40.4168, lon: -3.7038, region: 'Мадрид', country: 'Испания' },
      { name: 'Барселона', lat: 41.3851, lon: 2.1734, region: 'Каталония', country: 'Испания' },
      { name: 'Париж', lat: 48.8566, lon: 2.3522, region: 'Иль-де-Франс', country: 'Франция' },
      { name: 'Лондон', lat: 51.5074, lon: -0.1278, region: 'Англия', country: 'Великобритания' },
      { name: 'Берлин', lat: 52.5200, lon: 13.4050, region: 'Берлин', country: 'Германия' },
      { name: 'Рим', lat: 41.9028, lon: 12.4964, region: 'Лацио', country: 'Италия' },
      { name: 'Амстердам', lat: 52.3676, lon: 4.9041, region: 'Северная Голландия', country: 'Нидерланды' },
      { name: 'Вена', lat: 48.2082, lon: 16.3738, region: 'Вена', country: 'Австрия' },
      { name: 'Прага', lat: 50.0755, lon: 14.4378, region: 'Прага', country: 'Чехия' },
      { name: 'Варшава', lat: 52.2297, lon: 21.0122, region: 'Мазовецкое воеводство', country: 'Польша' },
      { name: 'Стокгольм', lat: 59.3293, lon: 18.0686, region: 'Стокгольм', country: 'Швеция' },
      { name: 'Осло', lat: 59.9139, lon: 10.7522, region: 'Осло', country: 'Норвегия' },
      { name: 'Копенгаген', lat: 55.6761, lon: 12.5683, region: 'Зеландия', country: 'Дания' },
      
      // Американские города
      { name: 'Нью-Йорк', lat: 40.7128, lon: -74.0060, region: 'Нью-Йорк', country: 'США' },
      { name: 'Лос-Анджелес', lat: 34.0522, lon: -118.2437, region: 'Калифорния', country: 'США' },
      { name: 'Чикаго', lat: 41.8781, lon: -87.6298, region: 'Иллинойс', country: 'США' },
      { name: 'Торонто', lat: 43.6532, lon: -79.3832, region: 'Онтарио', country: 'Канада' },
      { name: 'Сан-Паулу', lat: -23.5505, lon: -46.6333, region: 'Сан-Паулу', country: 'Бразилия' },
      { name: 'Буэнос-Айрес', lat: -34.6118, lon: -58.3960, region: 'Буэнос-Айрес', country: 'Аргентина' },
      
      // Азиатские города
      { name: 'Токио', lat: 35.6762, lon: 139.6503, region: 'Токио', country: 'Япония' },
      { name: 'Сеул', lat: 37.5665, lon: 126.9780, region: 'Сеул', country: 'Южная Корея' },
      { name: 'Пекин', lat: 39.9042, lon: 116.4074, region: 'Пекин', country: 'Китай' },
      { name: 'Шанхай', lat: 31.2304, lon: 121.4737, region: 'Шанхай', country: 'Китай' },
      { name: 'Сингапур', lat: 1.3521, lon: 103.8198, region: 'Сингапур', country: 'Сингапур' },
      { name: 'Мумбаи', lat: 19.0760, lon: 72.8777, region: 'Махараштра', country: 'Индия' },
      { name: 'Дели', lat: 28.7041, lon: 77.1025, region: 'Дели', country: 'Индия' },
      { name: 'Бангкок', lat: 13.7563, lon: 100.5018, region: 'Бангкок', country: 'Таиланд' },
      
      // Африканские города
      { name: 'Каир', lat: 30.0444, lon: 31.2357, region: 'Каир', country: 'Египет' },
      { name: 'Йоханнесбург', lat: -26.2041, lon: 28.0473, region: 'Гаутенг', country: 'ЮАР' },
      { name: 'Кейптаун', lat: -33.9249, lon: 18.4241, region: 'Западный Кейп', country: 'ЮАР' },
      
      // Австралийские города
      { name: 'Сидней', lat: -33.8688, lon: 151.2093, region: 'Новый Южный Уэльс', country: 'Австралия' },
      { name: 'Мельбурн', lat: -37.8136, lon: 144.9631, region: 'Виктория', country: 'Австралия' }
    ];

    // Находим ближайший город
    let closestCity = cities[0];
    let minDistance = getDistance(latitude, longitude, closestCity.lat, closestCity.lon);

    for (const city of cities) {
      const distance = getDistance(latitude, longitude, city.lat, city.lon);
      if (distance < minDistance) {
        minDistance = distance;
        closestCity = city;
      }
    }

    // Если расстояние больше 200 км, считаем что это неизвестный город
    if (minDistance > 200) {
      return {
        city: 'Неизвестный город',
        region: '',
        country: 'Неизвестная страна',
        latitude,
        longitude
      };
    }

    return {
      city: closestCity.name,
      region: closestCity.region,
      country: closestCity.country,
      latitude,
      longitude
    };
  } catch (error) {
    console.error('Ошибка при определении города:', error);
    // Возвращаем значения по умолчанию
    return {
      city: 'Москва',
      region: '',
      country: 'Россия',
      latitude,
      longitude
    };
  }
}

/**
 * Вычисляет расстояние между двумя точками в километрах
 */
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Радиус Земли в километрах
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Получает информацию о текущем местоположении пользователя
 */
export async function getCurrentLocation(): Promise<LocationInfo> {
  try {
    const position = await getCurrentPosition();
    const locationInfo = await getCityByCoordinates(
      position.coords.latitude,
      position.coords.longitude
    );
    
    return locationInfo;
  } catch (error) {
    console.error('Ошибка при получении местоположения:', error);
    // Возвращаем значения по умолчанию
    return {
      city: 'Москва',
      region: '',
      country: 'Россия',
      latitude: 55.7558,
      longitude: 37.6176
    };
  }
}

/**
 * Форматирует название города для отображения
 */
export function formatCityName(locationInfo: LocationInfo): string {
  if (locationInfo.city === 'Неизвестный город') {
    return 'Москва';
  }
  
  // Для российских городов показываем город и регион
  if (locationInfo.country === 'Россия') {
    if (locationInfo.city === locationInfo.region) {
      return locationInfo.city;
    }
    return locationInfo.region ? `${locationInfo.city}, ${locationInfo.region}` : locationInfo.city;
  }
  
  // Для международных городов показываем город и страну
  return `${locationInfo.city}, ${locationInfo.country}`;
}
