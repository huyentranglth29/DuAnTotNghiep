const crypto = require("crypto");

function encode(value) {
  return encodeURIComponent(String(value)).replace(/%20/g, "+");
}

function getSignedParams(params, excludeSignature = false) {
  return Object.entries(params || {})
    .filter(([key, value]) => (
      key.startsWith("vnp_")
      && value !== undefined
      && value !== null
      && value !== ""
      && (!excludeSignature || (key !== "vnp_SecureHash" && key !== "vnp_SecureHashType"))
    ))
    .sort(([left], [right]) => left.localeCompare(right))
    .reduce((result, [key, value]) => {
      result[key] = value;
      return result;
    }, {});
}

function buildQuery(params, excludeSignature = false) {
  return Object.entries(getSignedParams(params, excludeSignature))
    .map(([key, value]) => `${encode(key)}=${encode(value)}`)
    .join("&");
}

function sign(params, secret) {
  return crypto
    .createHmac("sha512", secret)
    .update(buildQuery(params, true), "utf8")
    .digest("hex");
}

function verify(query, secret) {
  const received = String(query?.vnp_SecureHash || "").toLowerCase();
  const expected = sign(query, secret).toLowerCase();
  if (!received || received.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(received), Buffer.from(expected));
}

function formatVnpDate(date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type) => parts.find((part) => part.type === type)?.value || "00";
  return `${get("year")}${get("month")}${get("day")}${get("hour")}${get("minute")}${get("second")}`;
}

module.exports = { buildQuery, sign, verify, formatVnpDate };
