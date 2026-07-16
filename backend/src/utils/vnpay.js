const crypto = require("crypto");

function encode(value) {
  return encodeURIComponent(String(value)).replace(/%20/g, "+");
}

function buildQuery(params) {
  return Object.keys(params)
    .filter((key) => params[key] !== undefined && params[key] !== null && params[key] !== "")
    .sort()
    .map((key) => `${encode(key)}=${encode(params[key])}`)
    .join("&");
}

function sign(params, secret) {
  return crypto.createHmac("sha512", secret).update(buildQuery(params), "utf8").digest("hex");
}

function verify(query, secret) {
  const params = { ...query };
  const received = String(params.vnp_SecureHash || "").toLowerCase();
  delete params.vnp_SecureHash;
  delete params.vnp_SecureHashType;
  const expected = sign(params, secret).toLowerCase();
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
