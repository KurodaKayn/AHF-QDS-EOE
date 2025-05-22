/**
 * 使用Fisher-Yates算法对数组进行原地洗牌。
 * @param array 要洗牌的数组。
 * @returns 洗牌后的数组（相同实例）。
 */
export function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]; // 交换元素
  }
  return array;
} 