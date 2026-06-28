export function formatMatchLabel(group: string, phaseLabel?: string) {
  const normalized = group.trim();
  if (phaseLabel) return phaseLabel;
  if (/^[A-Z]$/i.test(normalized)) return `G${normalized.toUpperCase()}`;
  return normalized;
}
