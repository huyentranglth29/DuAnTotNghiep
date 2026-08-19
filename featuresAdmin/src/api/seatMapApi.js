import axiosClient from './axiosClient';

const seatMapApi = {
  /** Sơ đồ ghế theo phòng chiếu (chế độ chuẩn theo phòng) */
  getRoomMap: roomId => axiosClient.get(`/admin/seat-map/room/${roomId}`),
  /** Khởi tạo sơ đồ ghế chuẩn cho phòng */
  generateRoomSeats: (roomId, force = false) =>
    axiosClient.post(`/admin/seat-map/room/${roomId}/generate-default`, {force}),
  /** Sơ đồ ghế realtime của một suất chiếu */
  getMap: showtimeId => axiosClient.get(`/admin/seat-map/${showtimeId}`),
  /** Thu hồi ghế đang giữ (bị chặn nếu khách đang thanh toán) */
  release: (showtimeId, seatLabel) =>
    axiosClient.post(`/admin/seat-map/${showtimeId}/release`, {seatLabel}),
  /** Khóa ghế bảo trì (bị chặn nếu ghế còn vé ở suất chưa chiếu) */
  lock: seatId => axiosClient.post(`/admin/seat-map/seats/${seatId}/lock`),
  /** Mở lại ghế bảo trì */
  unlock: seatId => axiosClient.post(`/admin/seat-map/seats/${seatId}/unlock`),
  /** Đổi loại ghế (bị chặn nếu ghế còn vé ở suất chưa chiếu) */
  changeType: (seatId, type) =>
    axiosClient.post(`/admin/seat-map/seats/${seatId}/type`, {type}),
};

export default seatMapApi;
