// Vite embute VITE_API_URL no bundle em build time (substituição estática),
// então não dá para ler env vars em runtime. Sem VITE_API_URL definido,
// inferimos a URL da API a partir do host usado para acessar o frontend,
// para funcionar em qualquer máquina/IP sem precisar rebuildar a imagem.
const inferApiUrl = () => `${window.location.protocol}//${window.location.hostname}:5005/api`;

export const getApiBaseUrl = (): string => import.meta.env.VITE_API_URL || inferApiUrl();
