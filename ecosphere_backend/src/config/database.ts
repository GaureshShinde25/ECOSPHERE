import mssql from 'mssql';
import { env } from './env.js';

export function getDatabaseConfig(): mssql.config {
  if (env.DB_WINDOWS_AUTH) {
    const server = (env.DB_SERVER === 'localhost' || env.DB_SERVER === '127.0.0.1')
      ? 'localhost\\SQLEXPRESS'
      : env.DB_SERVER;

    return {
      connectionString: `Driver={ODBC Driver 17 for SQL Server};Server=${server};Database=${env.DB_DATABASE};Trusted_Connection=yes;TrustServerCertificate=${env.DB_TRUST_SERVER_CERTIFICATE ? 'yes' : 'no'};`,
      pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000,
      },
    } as unknown as mssql.config;
  }

  return {
    server: env.DB_SERVER,
    port: env.DB_PORT,
    database: env.DB_DATABASE,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    options: {
      encrypt: env.DB_ENCRYPT,
      trustServerCertificate: env.DB_TRUST_SERVER_CERTIFICATE,
      enableArithAbort: true,
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000,
    },
  };
}

export const sqlConfig = getDatabaseConfig();
