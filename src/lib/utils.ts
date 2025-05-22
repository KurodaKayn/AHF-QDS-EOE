import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * 合并类名函数
 * 结合clsx和tailwind-merge实现类名合并和冲突解决
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
