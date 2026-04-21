export type DeepMutable<T> =
  // 1. If it's an array, explicitly convert it to a mutable Array
  T extends ReadonlyArray<infer U> ? Array<DeepMutable<U>> :
  // 2. If it's an object, map over its properties
  T extends object ? { -readonly [P in keyof T]: DeepMutable<T[P]> } :
  // 3. Otherwise, leave it as is
  T;
