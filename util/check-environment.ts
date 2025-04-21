export default function checkEnvironment(): string {
  // Если мы запускаемся в браузере, используем текущий домен
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  // В серверном рендеринге используем относительный путь или переменную окружения
  const envUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : ''; // Пустая строка для относительного пути на текущем домене

  return envUrl;
}
