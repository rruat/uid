import { customAlphabet } from "nanoid";

const alphabet = "0123456789abcdefghijklmnopqrstuvwxyz";
const nano = customAlphabet(alphabet, 8);

export function createId(prefix = "el"): string {
  return `${prefix}_${nano()}`;
}
