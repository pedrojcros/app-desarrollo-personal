import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function mergeClasses(...classes: ClassValue[]) {
  const combinedClasses = clsx(classes);
  return twMerge(combinedClasses);
}
