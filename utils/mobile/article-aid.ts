// utils
import { HttpError } from "@/lib/api/http-error";

// an app route's article id: a positive int (400 otherwise)
export function parseAid(value: string): number {
  const aid = Number(value);
  if (!Number.isInteger(aid) || aid <= 0 || aid > 2_147_483_647) {
    throw new HttpError("بيانات خاطئة", 400);
  }
  return aid;
}
