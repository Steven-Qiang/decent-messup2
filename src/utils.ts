import {transformAsync} from '@babel/core';

export function shuffle<T>(array: T[]): T[] {
  let currentIndex = array.length,
    temporaryValue: T,
    randomIndex: number;

  while (0 !== currentIndex) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}
export function getRandomIndex(max: number) {
  return Math.floor(Math.random() * max);
}

export async function transformCode(code: string) {
  const result = await transformAsync(code, {
    presets: ['@babel/preset-env'],
  });
  if (!result) return null;
  return result.code;
}
