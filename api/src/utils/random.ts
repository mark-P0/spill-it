import { raise } from "./errors";
import { letters } from "./strings";

export function randomFloat(from: number, to: number): number {
  const range = to - from;
  return Math.random() * range + from;
}
export function randomInteger(from: number, to: number): number {
  return Math.floor(randomFloat(from, to));
}
export function randomNumberByLength(length: number): number {
  return randomInteger(10 ** (length - 1), 10 ** length);
}

export function randomChoice<T>(items: ArrayLike<T>): T {
  const idx = randomInteger(0, items.length);
  return items[idx] ?? raise("Random choice does not exist...?");
}

export function randomLetter(): string {
  return randomChoice(letters);
}
export function randomString(length: number): string {
  return Array.from({ length }, randomLetter).join("");
}
