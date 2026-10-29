import mssqlStandard from 'mssql';
import mssqlWinAuth from 'mssql/msnodesqlv8.js';
import type mssql from 'mssql';
import { sqlConfig } from '../config/database.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

const mssqlClient = (env.DB_WINDOWS_AUTH ? mssqlWinAuth : mssqlStandard) as typeof mssql;

let pool: mssql.ConnectionPool | null = null;
let poolConnectingPromise: Promise<mssql.ConnectionPool> | null = null;

export const databaseService = {
  /**
   * Get or initialize the SQL Server Connection Pool
   */
  async getPool(): Promise<mssql.ConnectionPool> {
    if (pool && pool.connected) {
      return pool;
    }

    if (poolConnectingPromise) {
      return poolConnectingPromise;
    }

    poolConnectingPromise = (async () => {
      try {
        if (pool && pool.connected) {
          return pool;
        }
        const newPool = new mssqlClient.ConnectionPool(sqlConfig);
        await newPool.connect();
        pool = newPool;
        logger.info('Successfully connected to SQL Server connection pool', {
          server: env.DB_SERVER,
          database: env.DB_DATABASE,
          windowsAuth: env.DB_WINDOWS_AUTH,
        });
        return pool;
      } catch (error) {
        const err = error as Error;
        const orig = (error as any).originalError || error;
        logger.error('Failed to connect to SQL Server pool', {
          message: err.message,
          originalError: typeof orig === 'object' ? JSON.stringify(orig) : String(orig),
          details: JSON.stringify(orig, Object.getOwnPropertyNames(orig)),
          server: env.DB_SERVER,
          database: env.DB_DATABASE,
          windowsAuth: env.DB_WINDOWS_AUTH,
        });
        pool = null;
        throw err;
      } finally {
        poolConnectingPromise = null;
      }
    })();

    return poolConnectingPromise;
  },

  /**
   * Test database connectivity for health checks
   */
  async checkHealth(): Promise<{ connected: boolean; database: string; details?: string }> {
    try {
      const activePool = await this.getPool();
      const result = await activePool.request().query('SELECT DB_NAME() AS dbName, 1 AS health');
      const dbName = result.recordset[0]?.dbName || env.DB_DATABASE;
      return {
        connected: true,
        database: dbName,
      };
    } catch (error) {
      const err = error as Error;
      const sanitizedMessage = err.message
        ? err.message.replace(/User=.*?;/i, 'User=***;').replace(/Password=.*?;/i, 'Password=***;')
        : 'Connection failed';
      return {
        connected: false,
        database: env.DB_DATABASE,
        details: sanitizedMessage,
      };
    }
  },

  /**
   * Execute a parameterized SQL query
   */
  async query<T = any>(
    commandText: string,
    inputs?: Array<{ name: string; type: mssql.ISqlTypeWithLength | mssql.ISqlType; value: any }>
  ): Promise<mssql.IResult<T>> {
    const activePool = await this.getPool();
    const request = activePool.request();

    if (inputs) {
      for (const input of inputs) {
        request.input(input.name, input.type, input.value);
      }
    }

    return request.query<T>(commandText);
  },

  /**
   * Close pool on shutdown
   */
  async close(): Promise<void> {
    if (pool) {
      await pool.close();
      pool = null;
      logger.info('SQL Server connection pool closed');
    }
  },
};
