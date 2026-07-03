/**
 * Thông tin diễn viên trong cast.
 */
export interface DienVien {
  id: string | number;
  ten: string;
  anhAvatar?: string;
}

/**
 * Model phim dùng chung cho Home, Danh sách và Chi tiết.
 */
export interface Phim {
  id: string | number;
  tieuDe: string;
  posterUrl: string;
  diemDanhGia: number;
  theLoai: string;
  thoiLuong: string;
  tomTat?: string;
  danhSachDienVien?: DienVien[];
  /** Trạng thái hiển thị trên các màn hình */
  trangThai?: 'dang-chieu' | 'sap-chieu' | 'noi-bat';
  /** Nhãn tuổi (T13, T16, T18, P, ...) */
  nhanTuoi?: string;
  /** Phim nổi bật / HOT */
  laPhimHot?: boolean;
  /** Ảnh nền hero (màn chi tiết) */
  anhNen?: string;
  daoDien?: string;
  ngayPhatHanh?: string;
  giaVe?: number;
}
