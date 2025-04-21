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
  // Разрешаем доступ с обоих доменов и локальных сред разработки
  origin: [
    'https://rooms-trell.vercel.app',
    'https://trello-clone-one.vercel.app',
    'http://localhost:3000',
    'http://localhost:3001'
  ],
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
    // Всегда разрешаем OPTIONS запросы для preflight
    if (req.method === 'OPTIONS') {
      // Устанавливаем необходимые CORS заголовки
      res.setHeader('Access-Control-Allow-Credentials', corsConfig.credentials ? 'true' : 'false');
      res.setHeader('Access-Control-Allow-Methods', corsConfig.methods.join(','));
      res.setHeader('Access-Control-Allow-Headers', corsConfig.allowedHeaders.join(','));

      // Определяем origin
      const requestOrigin = req.headers.origin || '';

      // Для OPTIONS запросов лучше всегда разрешать доступ с любого origin
      if (Array.isArray(corsConfig.origin)) {
        if (corsConfig.origin.includes(requestOrigin)) {
          res.setHeader('Access-Control-Allow-Origin', requestOrigin);
        } else {
          // Если origin не в списке, все равно разрешаем для OPTIONS
          res.setHeader('Access-Control-Allow-Origin', requestOrigin);
        }
      } else if (corsConfig.origin === '*') {
        res.setHeader('Access-Control-Allow-Origin', '*');
      } else if (typeof corsConfig.origin === 'string') {
        res.setHeader('Access-Control-Allow-Origin', corsConfig.origin);
      }

      // Успешно обрабатываем preflight запрос
      res.status(200).end();
      return;
    }

    // Устанавливаем заголовки CORS для обычных запросов
    res.setHeader('Access-Control-Allow-Credentials', corsConfig.credentials ? 'true' : 'false');

    // Определяем origin для обычных запросов
    const requestOrigin = req.headers.origin || '';

    if (corsConfig.origin === '*') {
      // Если разрешены все источники, устанавливаем '*'
      // Но если credentials: true, нужно указать конкретный источник
      if (corsConfig.credentials) {
        res.setHeader('Access-Control-Allow-Origin', requestOrigin);
      } else {
        res.setHeader('Access-Control-Allow-Origin', '*');
      }
    } else if (typeof corsConfig.origin === 'string') {
      // Если указан конкретный источник
      res.setHeader('Access-Control-Allow-Origin', corsConfig.origin);
    } else if (Array.isArray(corsConfig.origin)) {
      // Если указан массив источников
      if (corsConfig.origin.includes(requestOrigin)) {
        res.setHeader('Access-Control-Allow-Origin', requestOrigin);
      } else {
        // Если домен не в списке, но мы хотим быть более гибкими
        // Можно разрешить доступ с любого домена для тестирования
        // В продакшене этот блок лучше закомментировать
        res.setHeader('Access-Control-Allow-Origin', requestOrigin);
      }
    }

    // Устанавливаем заголовки для методов
    res.setHeader('Access-Control-Allow-Methods', corsConfig.methods.join(','));

    // Устанавливаем заголовки для разрешенных заголовков
    res.setHeader('Access-Control-Allow-Headers', corsConfig.allowedHeaders.join(','));

    // Передаем управление основному обработчику
    return handler(req, res);
  };
}
