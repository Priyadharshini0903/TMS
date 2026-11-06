
import mysql from "mysql2/promise";

<<<<<<< HEAD
const g = globalThis as unknown as { pool?: mysql.Pool };
console.log("ENV CHECK:", process.env.MYSQL_HOST, process.env.MYSQL_USER, !!process.env.MYSQL_PASSWORD);
export const db =
  g.pool ??
  (g.pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT ?? 3306),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
=======
const globalForMySQL = globalThis as typeof globalThis & {
  mysqlPool?: mysql.Pool;
};

function createDatabasePool(): mysql.Pool {
  const host = process.env.MYSQL_HOST;
  const user = process.env.MYSQL_USER;
  const password = process.env.MYSQL_PASSWORD;
  const database = process.env.MYSQL_DATABASE;
  const port = Number(process.env.MYSQL_PORT ?? 3306);

  // Validate required environment configuration.
  if (!host || !user || !database) {
    throw new Error(
      "Database configuration missing. Check MYSQL_HOST, MYSQL_USER and MYSQL_DATABASE."
    );
  }

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("Invalid MYSQL_PORT configuration.");
  }

  return mysql.createPool({
    host,
    port,
    user,
    password,
    database,

    waitForConnections: true,
>>>>>>> origin/admin
    connectionLimit: 5,
    queueLimit: 10,
    connectTimeout: 5000,
    enableKeepAlive: true,
  });
}

// Reuse the pool across Next.js development reloads.
export const db =
  globalForMySQL.mysqlPool ??
  (globalForMySQL.mysqlPool = createDatabasePool());

export type Plant = {
  PlantName: string;
  PlantcodeName: string;
  Plantcode: string;
};

export async function getPlants(): Promise<Plant[]> {
  const [rows] = await db.query(
    `SELECT DISTINCT
       CONCAT(PlantName, ' (', PlantcodeName, ')') AS PlantName,
       PlantcodeName,
       Plantcode
     FROM VersionTbl_qa
     WHERE tmpDelete = 0
     ORDER BY PlantName ASC`
  );

  return rows as Plant[];
}
