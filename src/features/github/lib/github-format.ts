

export const ACCENT = '#a855f7'

export const LANG_COLORS: Record<string, string> = {
  TypeScript: '#3178c6', JavaScript: '#f1e05a', Python: '#3572a5',
  Rust: '#dea584', Go: '#00add8', Java: '#b07219', 'C++': '#f34b7d',
  C: '#555555', Swift: '#f05138', Kotlin: '#a97bff', Ruby: '#701516',
  PHP: '#4f5d95', Dart: '#00b4ab', Zig: '#ec915c', Vue: '#41b883',
}

export function formatStars(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`
  return String(count)
}
