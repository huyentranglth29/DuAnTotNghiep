import {useQuery} from '@tanstack/react-query';
import {
  layDanhSachPhim,
  layPhimTheoId,
  LocPhim,
  timKiemPhim,
} from '../services/movieService';
import {Phim} from '../types/phim';

/** Khóa cache TanStack Query cho module phim */
export const KHOA_PHIM = {
  danhSach: (loc?: LocPhim) => ['phim', 'danh-sach', loc ?? {}] as const,
  chiTiet: (id: string | number) => ['phim', 'chi-tiet', id] as const,
  timKiem: (tuKhoa: string, trangThai?: Phim['trangThai']) =>
    ['phim', 'tim-kiem', tuKhoa, trangThai ?? 'all'] as const,
};

const THOI_GIAN_CACHE_MS = 1000 * 60 * 5;

/**
 * Hook lấy danh sách phim — hỗ trợ lọc theo trạng thái / thể loại.
 */
export function useMovies(loc?: LocPhim) {
  return useQuery<Phim[], Error>({
    queryKey: KHOA_PHIM.danhSach(loc),
    queryFn: () => layDanhSachPhim(loc),
    staleTime: THOI_GIAN_CACHE_MS,
  });
}

/**
 * Hook lấy chi tiết một phim theo id.
 */
export function useMovie(id: string | number | undefined) {
  return useQuery<Phim, Error>({
    queryKey: KHOA_PHIM.chiTiet(id ?? 'unknown'),
    queryFn: () => layPhimTheoId(id as string | number),
    enabled: id !== undefined && id !== null && id !== '',
    staleTime: THOI_GIAN_CACHE_MS,
  });
}

/** Phim đang chiếu — màn Home & Danh sách */
export function useMoviesDangChieu() {
  return useMovies({trangThai: 'dang-chieu'});
}

/** Phim sắp chiếu — màn Home */
export function useMoviesSapChieu() {
  return useMovies({trangThai: 'sap-chieu'});
}

/** Phim nổi bật / featured — hero banner Home */
export function usePhimNoiBat() {
  return useMovies({trangThai: 'noi-bat'});
}

/** Tìm phim theo từ khóa — gọi API khi tuKhoa >= 2 ký tự */
export function useTimKiemPhim(
  tuKhoa: string,
  trangThai?: Phim['trangThai'],
) {
  const q = tuKhoa.trim();

  return useQuery<Phim[], Error>({
    queryKey: KHOA_PHIM.timKiem(q, trangThai),
    queryFn: () => timKiemPhim(q, trangThai ? {trangThai} : undefined),
    enabled: q.length >= 2,
    staleTime: THOI_GIAN_CACHE_MS,
  });
}
