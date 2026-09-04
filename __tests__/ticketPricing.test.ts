import {calculateTicketPrice} from '../src/utils/ticketPricing';

const atVietnamTime = (hour: number, minute: number) =>
  `2026-09-04T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00+07:00`;

describe('ticket pricing bands', () => {
  it.each([
    [5, 0, 40000],
    [11, 59, 40000],
    [12, 0, 65000],
    [17, 59, 65000],
    [18, 0, 90000],
    [23, 59, 90000],
    [0, 0, 90000],
    [4, 59, 90000],
  ])('prices %i:%i at %i', (hour, minute, expected) => {
    expect(calculateTicketPrice(atVietnamTime(hour, minute))).toBe(expected);
  });
});
