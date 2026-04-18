import { parsePhoneNumber } from "react-phone-number-input";

export const PHONE_NUMBER_PLACEHOLDER = "+39 333 123 4567";

export function normalizePhoneNumber(value: string): string | null {
  const phoneNumber = parsePhoneNumber(value);

  if (!phoneNumber?.isValid()) {
    return null;
  }

  return phoneNumber.number;
}
