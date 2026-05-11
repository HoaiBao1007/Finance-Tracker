const INTEGER_PATTERN = /^-?\d+$/;

export function moneyToNumber(value: string | number | bigint): number {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "bigint") {
    return Number(value);
  }

  return Number(value);
}

export function moneyToBigInt(value: string | number | bigint): bigint {
  if (typeof value === "bigint") {
    return value;
  }

  if (typeof value === "number") {
    if (!Number.isInteger(value)) {
      throw new Error("Money value must be an integer");
    }

    return BigInt(value);
  }

  if (!INTEGER_PATTERN.test(value.trim())) {
    throw new Error("Money string must be an integer");
  }

  return BigInt(value);
}

export function formatMoney(value: string | number | bigint): string {
  const normalizedValue =
    typeof value === "string" && INTEGER_PATTERN.test(value.trim())
      ? moneyToBigInt(value)
      : typeof value === "bigint"
        ? value
        : moneyToNumber(value);

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(normalizedValue);
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

export function formatMonthLabel(year: number, month: number): string {
  const date = new Date(Date.UTC(year, month - 1, 1));

  return new Intl.DateTimeFormat("vi-VN", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function formatDateRange(from: string, to: string): string {
  return `${formatDate(from)} - ${formatDate(to)}`;
}

export function toDateInputValue(value?: string): string {
  if (!value) {
    return new Date().toISOString().slice(0, 10);
  }

  return new Date(value).toISOString().slice(0, 10);
}