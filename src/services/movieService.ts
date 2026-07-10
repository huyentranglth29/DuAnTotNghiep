import apiClientRaw from './apiService';
import {DienVien, Phim} from '../types/phim';
import {DienVienApi, PhimApi, TrangThaiPhimApi} from '../types/phimApi';

type ApiClient = {
  get<T>(url: string, config?: {params?: Record<string, string | number>}): Promise<T>;
};

const apiClient = apiClientRaw as ApiClient;

/** Tham số lọc phim khi gọi API */
export type LocPhim = {
  trangThai?: Phim['trangThai'];
  theLoai?: string;
  gioiHan?: number;
};

const BANG_ANH_TRANG_THAI: Record<TrangThaiPhimApi, Phim['trangThai']> = {
  'now-showing': 'dang-chieu',
  'coming-soon': 'sap-chieu',
  featured: 'noi-bat',
};

const BANG_TRANG_THAI_API: Record<
  NonNullable<Phim['trangThai']>,
  TrangThaiPhimApi
> = {
  'dang-chieu': 'now-showing',
  'sap-chieu': 'coming-soon',
  'noi-bat': 'featured',
};

function chuyenDoiDienVien(dienVien: DienVienApi): DienVien {
  return {
    id: dienVien.id,
    ten: dienVien.name,
    anhAvatar: dienVien.avatarUrl,
  };
}

/** Chuyển dữ liệu API sang model Phim dùng trong app */
export function chuyenDoiPhimApi(duLieu: PhimApi): Phim {
  return {
    id: duLieu.id,
    tieuDe: duLieu.title,
    posterUrl: duLieu.posterUrl,
    diemDanhGia: duLieu.rating,
    theLoai: duLieu.genre,
    thoiLuong: duLieu.duration,
    tomTat: duLieu.synopsis,
    danhSachDienVien: duLieu.cast?.map(chuyenDoiDienVien),
    trangThai: duLieu.status ? BANG_ANH_TRANG_THAI[duLieu.status] : undefined,
    nhanTuoi: duLieu.ageRating,
    laPhimHot: duLieu.isHot,
    anhNen: duLieu.backdropUrl,
    daoDien: duLieu.director,
    ngayPhatHanh: duLieu.releaseDate,
    giaVe: duLieu.price,
  };
}

function taoQueryParams(loc?: LocPhim): Record<string, string | number> {
  const params: Record<string, string | number> = {};

  if (loc?.trangThai) {
    params.status = BANG_TRANG_THAI_API[loc.trangThai];
  }

  if (loc?.theLoai) {
    params.genre = loc.theLoai;
  }

  if (loc?.gioiHan) {
    params._limit = loc.gioiHan;
  }

  return params;
}

/** Bỏ dấu tiếng Việt để tìm không phân biệt dấu (vd: "am anh" → Ám Ảnh) */
function boDau(chuoi: string): string {
  return chuoi
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .trim();
}

/** Backend Mongo trả { success, data }; json-server trả mảng/object trực tiếp */
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

/**
 * Lấy danh sách phim từ API.
 * GET /movies
 */
export async function layDanhSachPhim(loc?: LocPhim): Promise<Phim[]> {
  const res = await apiClient.get('/movies', {
    params: taoQueryParams(loc),
  });
  const duLieu = layPayload<PhimApi[]>(res as PhimApi[] | {data: PhimApi[]});

  return (duLieu ?? []).map(chuyenDoiPhimApi);
}

/**
 * Lấy chi tiết một phim theo id.
 * GET /movies/:id
 */
export async function layPhimTheoId(id: string | number): Promise<Phim> {
  if (id === undefined || id === null || id === '') {
    throw new Error('id phim là bắt buộc');
  }

  const res = await apiClient.get(`/movies/${id}`);
  const duLieu = layPayload<PhimApi>(res as PhimApi | {data: PhimApi});
  return chuyenDoiPhimApi(duLieu);
}

/**
 * Tìm phim theo tên — lọc client-side, không dấu, khớp một phần tên.
 * Lấy danh sách theo tab (status) rồi lọc title.
 */
export async function timKiemPhim(
  tuKhoa: string,
  loc?: Pick<LocPhim, 'trangThai'>,
): Promise<Phim[]> {
  const q = tuKhoa.trim();
  if (!q) {
    return [];
  }

  const qChuan = boDau(q);
  const res = await apiClient.get('/movies', {
    params: taoQueryParams(loc),
  });
  const duLieu = layPayload<PhimApi[]>(res as PhimApi[] | {data: PhimApi[]});

  return (duLieu ?? [])
    .filter(item => boDau(item.title).includes(qChuan))
    .map(chuyenDoiPhimApi);
}
