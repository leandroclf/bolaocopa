const normalizeBasePath = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const withLeadingSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return withLeadingSlash.replace(/\/+$/, "");
};

export const basePath = normalizeBasePath(process.env.NEXT_PUBLIC_BASE_PATH ?? "");

export const withBasePath = (path: string) => {
  if (!basePath) return path;
  if (path === "/") return basePath;
  if (path.startsWith(`${basePath}/`)) return path;
  return path.startsWith("/") ? `${basePath}${path}` : `${basePath}/${path}`;
};
