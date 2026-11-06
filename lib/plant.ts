
import { cookies } from "next/headers";
import mysql, { RowDataPacket } from "mysql2/promise";
import { db } from "./db";

export type Session = {
  plantId: string;
  plantCode: string;
};

// Reuse pools instead of creating a new connection for every request.
const pools = new Map<string, mysql.Pool>();

export async function getSession(): Promise<Session | null> {
  try {
    const cookieStore = await cookies();
    const value = cookieStore.get("plant")?.value;

    if (!value) return null;

    const [plantId, plantCode] = value.split("|");

    if (!plantId?.trim() || !plantCode?.trim()) {
      return null;
    }

    return {
      plantId: plantId.trim(),
      plantCode: plantCode.trim(),
    };
  } catch (error) {
    console.error("[SESSION ERROR]", error);
    throw new Error("Unable to read session");
  }
}

export async function getPlant(s: Session) {
  if (!s?.plantCode) {
    throw new Error("Invalid plant session");
  }

  const [rows] = await db.query<RowDataPacket[]>(
<<<<<<< HEAD
    "SELECT * FROM VersionTbl_qa WHERE Plantcode = ? AND tmpDelete = 0 ORDER BY Plantcode ASC",
    [s.plantCode],
=======
    `SELECT *
     FROM VersionTbl_qa
     WHERE Plantcode = ? AND tmpDelete = 0
     ORDER BY Plantcode ASC`,
    [s.plantCode]
>>>>>>> origin/admin
  );

  return rows[0] ?? null;
}

export async function getGatePool(s: Session): Promise<mysql.Pool> {
  if (!s?.plantId) {
    throw new Error("Invalid plant ID");
  }

<<<<<<< HEAD
export async function getGatePool(s: Session) {
  const hit = pools.get(s.plantId);
  if (hit) return hit;
  const [r] = await db.query<RowDataPacket[]>(
    "SELECT * FROM plant_db_settings WHERE shortPlantCode = ? AND tmpDelete = 0 LIMIT 1",
    [s.plantId],
=======
  // Return the existing pool when available.
  const existingPool = pools.get(s.plantId);

  if (existingPool) {
    return existingPool;
  }

  // Read the selected plant's database configuration.
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT *
     FROM plant_db_settings
     WHERE shortPlantCode = ? AND tmpDelete = 0
     LIMIT 1`,
    [s.plantId]
>>>>>>> origin/admin
  );

  const config = rows[0];

  if (!config) {
    throw new Error("Plant database configuration not found");
  }

  const hostValue = String(config.serverMySQLHostName ?? "").trim();
  const [host, portValue] = hostValue.split(":");

  const user = String(config.serverMySQLUserName ?? "").trim();
  const password = String(config.serverMySQLPassword ?? "");
  const database = String(config.serverMySQLDatabase ?? "").trim();

  const port = Number(portValue || 3306);

  // Validate configuration before creating a pool.
  if (
    !host ||
    !user ||
    !database ||
    !Number.isInteger(port) ||
    port < 1 ||
    port > 65535
  ) {
    throw new Error("Invalid plant database configuration");
  }

  const pool = mysql.createPool({
    host,
    port,
    user,
    password,
    database,
    waitForConnections: true,
    connectionLimit: 3,
    queueLimit: 10,
    connectTimeout: 5000,
    enableKeepAlive: true,
  });

  pools.set(s.plantId, pool);

  return pool;
}

export async function getGates(s: Session) {
  const pool = await getGatePool(s);

  const special = ["3300", "3307"].includes(s.plantCode);

  const [rows] = await pool.query<RowDataPacket[]>(
<<<<<<< HEAD
    `SELECT SID, LOCATION FROM gaterfconfig WHERE ${special ? "PLANTID" : "PLANTCODE"} = ? ORDER BY SID ASC`,
    [special ? s.plantCode : s.plantId],
=======
    `SELECT SID, LOCATION
     FROM gaterfconfig
     WHERE ${special ? "PLANTID" : "PLANTCODE"} = ?
     ORDER BY SID ASC`,
    [special ? s.plantCode : s.plantId]
>>>>>>> origin/admin
  );

  return rows as { SID: number; LOCATION: string }[];
}
<<<<<<< HEAD
export type Weighbridge = {
  WBID: number;
  [key: string]: unknown;
};

export async function getWeighbridges(s: Session) {
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT *
     FROM wbipconfig
     WHERE PlantCode = ?
     ORDER BY WBID ASC`,
    [s.plantId]
  );

  return rows as Weighbridge[];
}
=======
>>>>>>> origin/admin
