import { cookies } from "next/headers";
import mysql, { RowDataPacket } from "mysql2/promise";
import { db } from "./db";

export type Session = { plantId: string; plantCode: string };

export async function getSession(): Promise<Session | null> {
  const v = (await cookies()).get("plant")?.value;
  if (!v) return null;
  const [plantId, plantCode] = v.split("|");
  return { plantId, plantCode };
}

export async function getPlant(s: Session) {
  const [rows] = await db.query<RowDataPacket[]>(
    "SELECT * FROM VersionTbl_qa WHERE Plantcode = ? AND tmpDelete = 0 ORDER BY Plantcode ASC",
    [s.plantCode]
  );
  return rows[0] ?? null;
}

const pools = new Map<string, mysql.Pool>();

export async function getGatePool(s: Session) {
  const hit = pools.get(s.plantId);
  if (hit) return hit;
  const [r] = await db.query<RowDataPacket[]>(
    "SELECT * FROM plant_db_settings WHERE shortPlantCode = ? AND tmpDelete = 0 LIMIT 1",
    [s.plantId]
  );
  const c = r[0];
  if (!c) throw new Error("Plant DB settings not found");
  const [host, port] = String(c.serverMySQLHostName).split(":");
  const pool = mysql.createPool({
    host,
    port: Number(port || 3306),
    user: c.serverMySQLUserName,
    password: c.serverMySQLPassword,
    database: c.serverMySQLDatabase,
    connectionLimit: 3,
    connectTimeout: 5000,
  });
  pools.set(s.plantId, pool);
  return pool;
}

export async function getGates(s: Session) {
  const pool = await getGatePool(s);
  const special = ["3300", "3307"].includes(s.plantCode); // same LCW1/LCW2 rule as PHP
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT SID, LOCATION FROM gaterfconfig WHERE ${special ? "PLANTID" : "PLANTCODE"} = ? ORDER BY SID ASC`,
    [special ? s.plantCode : s.plantId]
  );
  return rows as { SID: number; LOCATION: string }[];
}