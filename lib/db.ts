import mysql from "mysql2/promise";

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
    connectionLimit: 5,
  }));
export type Plant = { PlantName: string; PlantcodeName: string; Plantcode: string };

export async function getPlants(): Promise<Plant[]> {
  const [rows] = await db.query(
    `SELECT DISTINCT CONCAT(PlantName,' (',PlantcodeName,')') AS PlantName, PlantcodeName, Plantcode
     FROM VersionTbl_qa WHERE tmpDelete = 0 ORDER BY PlantName ASC`
  );
  return rows as Plant[];
}