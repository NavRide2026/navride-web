/**
 * Node ESM resolve hook: allow extensionless relative imports of .ts
 * when running route-studio tests with --experimental-strip-types.
 */
export async function resolve(specifier, context, nextResolve) {
  try {
    return await nextResolve(specifier, context);
  } catch (error) {
    const canRetry =
      error?.code === "ERR_MODULE_NOT_FOUND" &&
      typeof specifier === "string" &&
      (specifier.startsWith("./") || specifier.startsWith("../")) &&
      !/\.[cm]?[jt]sx?$/.test(specifier);
    if (!canRetry) throw error;
    return nextResolve(`${specifier}.ts`, context);
  }
}
