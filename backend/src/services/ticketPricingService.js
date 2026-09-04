const CINEMA_TIME_ZONE = "Asia/Ho_Chi_Minh";

const TICKET_PRICE_BANDS = Object.freeze({
  morning: Object.freeze({ label: "Buổi sáng", price: 40000 }),
  afternoon: Object.freeze({ label: "Buổi chiều", price: 65000 }),
  evening: Object.freeze({ label: "Buổi tối", price: 90000 }),
});

const getVietnamHour = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Giờ bắt đầu suất chiếu không hợp lệ");
  }

  const hourPart = new Intl.DateTimeFormat("en-GB", {
    timeZone: CINEMA_TIME_ZONE,
    hour: "2-digit",
    hourCycle: "h23",
  })
    .formatToParts(date)
    .find((part) => part.type === "hour");

  return Number(hourPart.value);
};

const getTicketPriceBand = (startTime) => {
  const hour = getVietnamHour(startTime);
  if (hour >= 5 && hour < 12) return TICKET_PRICE_BANDS.morning;
  if (hour >= 12 && hour < 18) return TICKET_PRICE_BANDS.afternoon;
  return TICKET_PRICE_BANDS.evening;
};

const calculateShowtimePrice = (startTime) => getTicketPriceBand(startTime).price;

module.exports = {
  CINEMA_TIME_ZONE,
  TICKET_PRICE_BANDS,
  calculateShowtimePrice,
  getTicketPriceBand,
};
