import type { NextApiRequest, NextApiResponse } from 'next';

// Типы для middleware
type NextHandler = (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void;

// Определяем типы для CORS конфигурации
type CorsOrigin = string | string[] | boolean;

interface CorsConfig {
  origin: CorsOrigin;
  methods: string[];
  allowedHeaders: string[];
  credentials: boolean;
}

// Конфигурация CORS по умолчанию
const defaultCorsConfig: CorsConfig = {
  // В продакшене мы разрешаем все запросы, чтобы избежать проблем с предварительными деплоями и другими доменами
  origin: '*',
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'X-CSRF-Token',
    'X-Requested-With',
    'Accept',
    'Accept-Version',
    'Content-Length',
    'Content-MD5',
    'Content-Type',
    'Date',
    'X-Api-Version',
    'Authorization'
  ],
  credentials: true
};

/**
 * Middleware для обработки CORS
 */
export function cors(handler: NextHandler, corsConfig = defaultCorsConfig): NextHandler {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    // Получаем origin из заголовков
    const requestOrigin = req.headers.origin || '';

    // Всегда разрешаем OPTIONS запросы для preflight
    if (req.method === 'OPTIONS') {
      // Устанавливаем необходимые CORS заголовки
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', corsConfig.methods.join(','));
      res.setHeader('Access-Control-Allow-Headers', corsConfig.allowedHeaders.join(','));

      // Для preflight запросов всегда разрешаем запрашивающий origin
      res.setHeader('Access-Control-Allow-Origin', requestOrigin);

      // Успешно обрабатываем preflight запрос
      res.status(200).end();
      return;
    }

    // Устанавливаем заголовки CORS для обычных запросов
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // Разрешаем запросы с любого origin, но если credentials: true,
    // мы должны указать конкретный origin вместо "*"
    res.setHeader('Access-Control-Allow-Origin', requestOrigin);

    // Устанавливаем заголовки для методов
    res.setHeader('Access-Control-Allow-Methods', corsConfig.methods.join(','));

    // Устанавливаем заголовки для разрешенных заголовков
    res.setHeader('Access-Control-Allow-Headers', corsConfig.allowedHeaders.join(','));

    // Передаем управление основному обработчику
    return handler(req, res);
  };
}
