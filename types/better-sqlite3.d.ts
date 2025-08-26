declare module 'better-sqlite3' {
  interface RunResult {
    changes: number
    lastInsertROWID?: number
  }

  interface Statement {
  run(...params: unknown[]): RunResult
  get(...params: unknown[]): unknown
  all(...params: unknown[]): unknown[]
  }

  class Database {
  constructor(filename: string, options?: unknown)
  exec(sql: string): void
  prepare(sql: string): Statement
  close(): void
  }

  export default Database
}
