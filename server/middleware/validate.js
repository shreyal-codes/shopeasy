// Small helper functions used by the controllers to validate input.
const isEmail = (v) => typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isPhone = (v) => /^[6-9]\d{9}$/.test(String(v || ''));   // 10 digit Indian mobile
const isPin   = (v) => /^\d{6}$/.test(String(v || ''));         // 6 digit PIN code
const isText  = (v, min = 1) => typeof v === 'string' && v.trim().length >= min;
const isPosInt = (v) => Number.isInteger(Number(v)) && Number(v) > 0;

module.exports = { isEmail, isPhone, isPin, isText, isPosInt };
