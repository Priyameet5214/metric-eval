import { Comparator } from "./supabase";

export function evaluateComparator(
    value: number,
    threshold: number,
    comparator: Comparator
  ): boolean {
    switch (comparator) {
      case 'GT': return value > threshold;
      case 'LT': return value < threshold;
      case 'GTE': return value >= threshold;
      case 'LTE': return value <= threshold;
      case 'EQ': return value === threshold;
      default: return false;
    }
  }

  export function isCooldownActive(
    lastTriggeredAt: string | null,
    cooldownSeconds: number
  ): boolean {
    if (!lastTriggeredAt || cooldownSeconds === 0) return false;
  
    const last = new Date(lastTriggeredAt).getTime();
    const now = Date.now();
  
    return (now - last) < cooldownSeconds * 1000;
  }