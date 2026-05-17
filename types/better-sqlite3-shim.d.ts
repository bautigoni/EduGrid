// Local declaration so `npx tsc --noEmit` works before `npm install` runs.
// The real types come from @types/better-sqlite3 once dependencies are installed.
declare module "better-sqlite3" {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyValue: any;
  export = anyValue;
}
