# API Endpoint: `/user/stats`

## Описание
Эндпоинт для получения информации о пользователе и его статистике.

## Запрос

### Метод
`POST`

### URL
```
/api/user/stats
```

### Headers
```
X-User-Id: {user-id}
Content-Type: application/json
```

### Body
Тело запроса не требуется (или может быть пустым объектом `{}`). User-id передается в заголовке `X-User-Id` для безопасности личных данных.

## Ответ

### Успешный ответ (200 OK)

#### Структура ответа
```json
{
  "success": true,
  "data": {
    "user_id": "string",
    "name": "string",
    "surname": "string",
    "email": "string",
    "phone": "string",
    "total_applications": 0,
    "approved_applications": 0,
    "in_progress_applications": 0,
    "completed_applications": 0,
    "total_earnings": 0,
    "average_rating": 0.0,
    "favourite_offers_count": 0
  }
}
```

#### Описание полей

| Поле | Тип | Описание |
|------|-----|----------|
| `user_id` | string | UUID пользователя |
| `name` | string | Имя пользователя |
| `surname` | string | Фамилия пользователя |
| `email` | string | Email пользователя |
| `phone` | string | Номер телефона в формате строки (например: "+7 (999) 123-45-67") |
| `total_applications` | number | Общее количество заявок пользователя |
| `approved_applications` | number | Количество одобренных заявок |
| `in_progress_applications` | number | Количество заявок в процессе выполнения |
| `completed_applications` | number | Количество выполненных заявок |
| `total_earnings` | number | Общая сумма заработанных средств (в копейках или как число) |
| `average_rating` | number | Средний рейтинг пользователя (число с плавающей точкой, например: 4.5) |
| `favourite_offers_count` | number | Количество избранных предложений |

#### Пример ответа
```json
{
  "success": true,
  "data": {
    "user_id": "1416fac6-6954-4d49-a35c-684ead433361",
    "name": "Иван",
    "surname": "Петров",
    "email": "ivan.petrov@example.com",
    "phone": "+7 (999) 123-45-67",
    "total_applications": 25,
    "approved_applications": 20,
    "in_progress_applications": 5,
    "completed_applications": 15,
    "total_earnings": 75000,
    "average_rating": 4.8,
    "favourite_offers_count": 8
  }
}
```

### Ошибки

#### 401 Unauthorized
```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "User ID не предоставлен или неверен"
}
```

#### 404 Not Found
```json
{
  "success": false,
  "error": "Not Found",
  "message": "Пользователь не найден"
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal Server Error",
  "message": "Внутренняя ошибка сервера"
}
```

## Пример использования

### cURL
```bash
curl -X POST "http://localhost:3000/api/user/stats" \
  -H "X-User-Id: 1416fac6-6954-4d49-a35c-684ead433361" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### JavaScript/Fetch
```javascript
const response = await fetch('/api/user/stats', {
  method: 'POST',
  headers: {
    'X-User-Id': '1416fac6-6954-4d49-a35c-684ead433361',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({}) // Пустое тело запроса или можно не передавать
});

const result = await response.json();
```

## Важные замечания

1. **Метод POST**: Эндпоинт использует POST метод вместо GET для безопасности передачи личных данных пользователя
2. **user-id обязателен**: Эндпоинт требует передачи `user-id` в заголовке `X-User-Id`, как и все остальные эндпоинты API
3. **Формат phone**: Рекомендуется использовать строковый формат для телефона, чтобы сохранять форматирование (пробелы, скобки и т.д.)
4. **total_earnings**: Может быть передано как число (в копейках) или как целое число в рублях. В интерфейсе значение будет отформатировано с разделителями тысяч
5. **average_rating**: Представляет средний рейтинг пользователя, рассчитывается на основе всех отзывов о выполненных заявках

