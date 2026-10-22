/** Replace {placeholders} in a dictionary string. */
export function fmt(template: string, vars: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (m, key) => (key in vars ? String(vars[key]) : m));
}
