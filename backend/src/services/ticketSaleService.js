function assertTicketSaleOpen(movie, now = new Date()) {
  if (!movie) return;
  const opensAt = movie.ticketSaleStartAt;
  if (opensAt && new Date(opensAt) > now) {
    const error = new Error(`Vé chưa mở bán. Thời gian mở bán: ${new Date(opensAt).toLocaleString("vi-VN", {timeZone: "Asia/Ho_Chi_Minh"})}`);
    error.status = 403;
    error.code = "TICKET_SALE_NOT_OPEN";
    throw error;
  }
}

module.exports = {assertTicketSaleOpen};
