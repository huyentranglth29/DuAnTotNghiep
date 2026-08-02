import apiClientRaw from './apiService';

const apiClient = apiClientRaw as {
  get<T>(url: string): Promise<T>;
  post<T>(url: string): Promise<T>;
  delete<T>(url: string): Promise<T>;
};

function payload<T>(value: T | {data: T}): T {
  return value && typeof value === 'object' && 'data' in value
    ? (value as {data: T}).data
    : (value as T);
}

export async function layDanhSachNhacPhim(): Promise<string[]> {
  const response = await apiClient.get<string[] | {data: string[]}>(
    '/api/movie-reminders',
  );
  return payload(response) || [];
}

export async function dangKyNhacPhim(movieId: string): Promise<void> {
  await apiClient.post(`/api/movie-reminders/${movieId}`);
}

export async function huyNhacPhim(movieId: string): Promise<void> {
  await apiClient.delete(`/api/movie-reminders/${movieId}`);
}
