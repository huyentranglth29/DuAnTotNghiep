import {MovieBookingInfo} from './MovieName';
import {Phim} from '../../../types/phim';

export function phimSangBooking(phim: Phim): MovieBookingInfo {
  return {
    id: phim.id,
    title: phim.tieuDe,
    duration: phim.thoiLuong,
    genre: phim.theLoai,
    poster: {uri: phim.posterUrl},
    description: phim.tomTat,
    director: phim.daoDien,
    cast: phim.danhSachDienVien?.map(item => item.ten),
    releaseDate: phim.ngayPhatHanh,
    ageRating: phim.nhanTuoi,
  };
}

export function layMauNhanTuoi(nhan?: string): string {
  if (nhan === 'P' || nhan === 'PG') {
    return '#87c846';
  }

  if (nhan === 'T13' || nhan === 'PG-13') {
    return '#f1d83f';
  }

  return '#f47fa2';
}

export function layTrangThaiTuTab(
  tab: string,
): Phim['trangThai'] | undefined {
  if (tab === 'SẮP CHIẾU') {
    return 'sap-chieu';
  }

  if (tab === 'ĐANG CHIẾU') {
    return 'dang-chieu';
  }

  return undefined;
}
