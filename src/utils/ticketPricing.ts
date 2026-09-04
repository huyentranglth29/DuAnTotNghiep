export const TICKET_PRICE_BANDS = {
  morning: {label: 'Buổi sáng', price: 40000},
  afternoon: {label: 'Buổi chiều', price: 65000},
  evening: {label: 'Buổi tối', price: 90000},
} as const;

export function calculateTicketPrice(startTime: string | Date): number {
  const date = startTime instanceof Date ? startTime : new Date(startTime);
  if (Number.isNaN(date.getTime())) return TICKET_PRICE_BANDS.evening.price;
  const hourPart = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date).find(part => part.type === 'hour');
  const hour = Number(hourPart?.value);
  if (hour >= 5 && hour < 12) return TICKET_PRICE_BANDS.morning.price;
  if (hour >= 12 && hour < 18) return TICKET_PRICE_BANDS.afternoon.price;
  return TICKET_PRICE_BANDS.evening.price;
}
