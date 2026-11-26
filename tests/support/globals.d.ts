// tests/support/setup.cjs: a stand-in for a module, for every later require of it
declare function stubModule(specifier: string, exports: unknown): void;
