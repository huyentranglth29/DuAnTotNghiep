import apiClientRaw from './apiService';

type ApiClient = {
  get<T>(url: string, config?: {params?: Record<string, string>}): Promise<T>;
};

const apiClient = apiClientRaw as ApiClient;

export type SuatChieuApi = {
  _id: string;
  startTime: string;
  endTime: string;
  price: number;
  status: string;
  movie?: {
    _id?: string;
    title?: string;
    duration?: string | number;
    posterUrl?: string;
    genre?: string | string[];
  };
  room?: {
    _id?: string;
    name?: string;
    type?: string;
    totalSeats?: number;
  };
};

function layPayload<T>(res: T | {data: T}): T {
  if (
    res !== null &&
    typeof res === 'object' &&
    !Array.isArray(res) &&
    'data' in res
  ) {
    return (res as {data: T}).data;
  }
  return res as T;
}

export type LocSuatChieu = {
  movieId?: string;
  date?: string; // YYYY-MM-DD
  status?: string;
  /** Chỉ suất còn đặt được (khớp Admin scheduled + chưa hết giờ) */
  bookable?: boolean;
};

/** GET /api/showtimes */
export async function layDanhSachSuatChieu(
  loc?: LocSuatChieu,
): Promise<SuatChieuApi[]> {
  const params: Record<string, string> = {};
  if (loc?.movieId) params.movie = String(loc.movieId);
  if (loc?.date) params.date = loc.date;
  if (loc?.status) params.status = loc.status;
  if (loc?.bookable) params.bookable = '1';

  const res = await apiClient.get('/api/showtimes', {params});
  const data = layPayload<SuatChieuApi[]>(
    res as SuatChieuApi[] | {data: SuatChieuApi[]},
  );
  return Array.isArray(data) ? data : [];
}

/** Key ngày theo giờ VN — khớp bộ lọc date trên backend */
export function toDateKeyVN(value: Date | string) {
  const d = typeof value === 'string' ? new Date(value) : value;
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d);
  const y = parts.find(p => p.type === 'year')?.value ?? '1970';
  const m = parts.find(p => p.type === 'month')?.value ?? '01';
  const day = parts.find(p => p.type === 'day')?.value ?? '01';
  return `${y}-${m}-${day}`;
}

export function formatGio(value?: string) {
  if (!value) return '--:--';
  return new Date(value).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatNgayNgan(value?: string) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
  });
}

export function toDateKey(value: Date | string) {
  return toDateKeyVN(value);
}

export default {
  layDanhSachSuatChieu,
};
