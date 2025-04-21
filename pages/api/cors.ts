import type { NextApiRequest, NextApiResponse } from 'next';

// Типы для middleware
type NextHandler = (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void;

// Конфигурация CORS по умолчанию
const defaultCorsConfig = {
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
    // Устанавливаем заголовки CORS
    res.setHeader('Access-Control-Allow-Credentials', corsConfig.credentials ? 'true' : 'false');

    if (corsConfig.origin === '*') {
      // Если разрешены все источники, устанавливаем '*'
      // Но если credentials: true, нужно указать конкретный источник
      if (corsConfig.credentials) {
        const requestOrigin = req.headers.origin || '';
        res.setHeader('Access-Control-Allow-Origin', requestOrigin);
      } else {
        res.setHeader('Access-Control-Allow-Origin', '*');
      }
    } else if (typeof corsConfig.origin === 'string') {
      // Если указан конкретный источник
      res.setHeader('Access-Control-Allow-Origin', corsConfig.origin);
    } else if (Array.isArray(corsConfig.origin)) {
      // Если указан массив источников
      const requestOrigin = req.headers.origin || '';
      if (corsConfig.origin.includes(requestOrigin)) {
        res.setHeader('Access-Control-Allow-Origin', requestOrigin);
      }
    }

    // Устанавливаем заголовки для методов
    res.setHeader('Access-Control-Allow-Methods', corsConfig.methods.join(','));

    // Устанавливаем заголовки для разрешенных заголовков
    res.setHeader('Access-Control-Allow-Headers', corsConfig.allowedHeaders.join(','));

    // Обрабатываем preflight OPTIONS запросы
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    // Передаем управление основному обработчику
    return handler(req, res);
  };
}
