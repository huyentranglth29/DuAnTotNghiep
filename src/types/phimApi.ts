/**
 * Dữ liệu phim từ JSON Server (db.json) — dùng key tiếng Anh cho API.
 */
export interface DienVienApi {
  id: string | number;
  name: string;
  avatarUrl?: string;
}

export type TrangThaiPhimApi = 'now-showing' | 'coming-soon' | 'featured';

export interface PhimApi {
  id: string | number;
  title: string;
  posterUrl: string;
  backdropUrl?: string;
  rating: number;
  genre: string;
  duration: string;
  synopsis?: string;
  cast?: DienVienApi[];
  status?: TrangThaiPhimApi;
  ageRating?: string;
  isHot?: boolean;
  director?: string;
  releaseDate?: string;
  price?: number;
}
