import * as SQLite from "expo-sqlite";
export type Tx = { id:string; user_id:string; transaction_type:"income"|"expense"; amount:number; category:string; description:string; transaction_date:string; created_at:string; pending?:number };
const db = SQLite.openDatabaseSync("neo-expense.db");
export function initLocal() {
  db.execSync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY NOT NULL, user_id TEXT NOT NULL, transaction_type TEXT NOT NULL,
      amount REAL NOT NULL, category TEXT NOT NULL, description TEXT NOT NULL DEFAULT '',
      transaction_date TEXT NOT NULL, created_at TEXT NOT NULL, pending INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_tx_user_date ON transactions(user_id, transaction_date DESC);
    CREATE TABLE IF NOT EXISTS sync_queue (
      id TEXT PRIMARY KEY NOT NULL, user_id TEXT NOT NULL, operation TEXT NOT NULL,
      payload TEXT NOT NULL, created_at TEXT NOT NULL
    );
  `);
}
export function listLocal(userId:string):Tx[] {
  return db.getAllSync<Tx>("SELECT * FROM transactions WHERE user_id=? ORDER BY transaction_date DESC, created_at DESC",userId);
}
export function saveLocal(tx:Tx) {
  db.runSync(`INSERT OR REPLACE INTO transactions (id,user_id,transaction_type,amount,category,description,transaction_date,created_at,pending)
    VALUES (?,?,?,?,?,?,?,?,1)`,tx.id,tx.user_id,tx.transaction_type,tx.amount,tx.category,tx.description,tx.transaction_date,tx.created_at);
  db.runSync("INSERT OR REPLACE INTO sync_queue (id,user_id,operation,payload,created_at) VALUES (?,?,?,?,?)",
    tx.id,tx.user_id,"upsert",JSON.stringify(tx),new Date().toISOString());
}
export function removeLocal(id:string,userId:string) {
  db.runSync("DELETE FROM transactions WHERE id=? AND user_id=?",id,userId);
  db.runSync("INSERT OR REPLACE INTO sync_queue (id,user_id,operation,payload,created_at) VALUES (?,?,?,?,?)",
    id,userId,"delete",JSON.stringify({id}),new Date().toISOString());
}
export function queued(userId:string) {
  return db.getAllSync<{id:string;operation:string;payload:string}>("SELECT id,operation,payload FROM sync_queue WHERE user_id=? ORDER BY created_at",userId);
}
export function markSynced(id:string,userId:string) {
  db.runSync("DELETE FROM sync_queue WHERE id=? AND user_id=?",id,userId);
  db.runSync("UPDATE transactions SET pending=0 WHERE id=? AND user_id=?",id,userId);
}
export function mergeRemote(rows:any[],userId:string) {
  for(const r of rows) {
    const pending=db.getFirstSync<{n:number}>("SELECT COUNT(*) AS n FROM sync_queue WHERE id=? AND user_id=?",r.id,userId);
    if(pending?.n) continue;
    db.runSync(`INSERT OR REPLACE INTO transactions (id,user_id,transaction_type,amount,category,description,transaction_date,created_at,pending)
      VALUES (?,?,?,?,?,?,?,?,0)`,r.id,userId,r.transaction_type,Number(r.amount),r.category||"Other",r.description||"",r.transaction_date,r.created_at||new Date().toISOString());
  }
}
export function clearUserLocal(userId:string) {
  db.runSync("DELETE FROM transactions WHERE user_id=?",userId);
  db.runSync("DELETE FROM sync_queue WHERE user_id=?",userId);
}
