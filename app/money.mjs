// USD cents retain six extra decimals so converting paise never rounds to a whole USD cent.
// Sum integer units to keep the ledger invariant exact, including history rebuilds.
export const MONEY_SCALE = 1_000_000;
/** @param {number} value */
export const roundMoney = value => Math.round(value * MONEY_SCALE) / MONEY_SCALE;
/** @param {number} value */
export const moneyUnits = value => BigInt(Math.round(value * MONEY_SCALE));
/** @param {number[]} values */
export const sumUnits = values => values.reduce((total, value) => total + moneyUnits(value), BigInt(0));
/** @param {number[]} values */
export const sumMoney = values => Number(sumUnits(values)) / MONEY_SCALE;
/** @param {number} left @param {number} right */
export const addMoney = (left, right) => sumMoney([left, right]);
/** @param {number} left @param {number} right */
export const subtractMoney = (left, right) => sumMoney([left, -right]);
/** @param {unknown} value */
export const isPreciseMoney = value => typeof value === "number" && Number.isFinite(value)
  && Number.isSafeInteger(Math.round(value * MONEY_SCALE)) && value === roundMoney(value);
