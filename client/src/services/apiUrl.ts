// Vite embute VITE_API_URL no bundle em build time (substituição estática),
// então não dá para ler env vars em runtime. Sem VITE_API_URL definido,
// usamos um caminho relativo: o reverse proxy roteia /taxonomy/api para o backend.
const inferApiUrl = () => '/taxonomy/api';

export const getApiBaseUrl = (): string => import.meta.env.VITE_API_URL || inferApiUrl();
