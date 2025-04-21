export default function checkEnvironment(): string {
  // Если мы запускаемся в браузере, используем текущий домен
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  // В серверном рендеринге используем переменную окружения или значение по умолчанию
  const envUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : '');

  console.log('Server environment URL:', envUrl || 'relative URL (empty string)');
  return envUrl;
}
