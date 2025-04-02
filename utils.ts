import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatAddress(address: string): string {
  if (!address) return ""
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function formatNumber(value: string | number): string {
  if (!value) return "0"

  const num = typeof value === "string" ? Number.parseFloat(value) : value

  if (isNaN(num)) return "0"

  // For very small numbers
  if (num < 0.0001 && num > 0) {
    return "<0.0001"
  }

  // For numbers less than 1
  if (num < 1) {
    return num.toFixed(4)
  }

  // For numbers between 1 and 1,000
  if (num < 1000) {
    return num.toFixed(2)
  }

  // For numbers between 1,000 and 1,000,000
  if (num < 1000000) {
    return (num / 1000).toFixed(2) + "K"
  }

  // For numbers between 1,000,000 and 1,000,000,000
  if (num < 1000000000) {
    return (num / 1000000).toFixed(2) + "M"
  }

  // For numbers greater than or equal to 1,000,000,000
  return (num / 1000000000).toFixed(2) + "B"
}

