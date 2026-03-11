export const apiFetch = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('tukeran_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Token expired or invalid
    localStorage.removeItem('tukeran_user');
    localStorage.removeItem('tukeran_token');
    window.location.href = '/login';
    throw new Error('Sesi telah berakhir. Silakan login kembali.');
  }

  return response;
};
