interface ObjectConstructor {
  fromEntries<TValue, TKey extends string>(
    entries: Iterable<readonly [TKey, TValue]>,
  ): Readonly<{ [k in TKey]: TValue }>;
}
