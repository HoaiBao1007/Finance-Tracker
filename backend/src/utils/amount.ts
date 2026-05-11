import { AppError } from "./app-error";

type AmountInput = string | number | bigint;

const INTEGER_PATTERN = /^-?\d+$/;

export const parsePositiveAmount = (value: AmountInput, fieldName = "amount") => {
  let normalizedAmount: bigint;

  if (typeof value === "bigint") {
    normalizedAmount = value;
  } else if (typeof value === "number") {
    if (!Number.isInteger(value) || !Number.isSafeInteger(value)) {
      throw new AppError(`${fieldName} must be a safe integer`, 400, "INVALID_AMOUNT");
    }

    normalizedAmount = BigInt(value);
  } else {
    const trimmedValue = value.trim();

    if (!INTEGER_PATTERN.test(trimmedValue)) {
      throw new AppError(`${fieldName} must be an integer string`, 400, "INVALID_AMOUNT");
    }

    normalizedAmount = BigInt(trimmedValue);
  }

  if (normalizedAmount <= 0n) {
    throw new AppError(`${fieldName} must be greater than 0`, 400, "INVALID_AMOUNT");
  }

  return normalizedAmount;
};

export const serializeAmount = (value: bigint) => value.toString();
