import mariadb from 'mariadb'
import dotenv from 'dotenv'

dotenv.config()

async function main() {
  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) {
    console.error('DATABASE_URL is not set')
    return
  }

  const url = new URL(dbUrl)
  const connConfig = {
    host: url.hostname,
    port: Number(url.port) || 3306,
    user: url.username,
    password: decodeURIComponent(url.password),
    database: url.pathname.replace('/', ''),
    connectTimeout: 8000,
  }

  try {
    const conn = await mariadb.createConnection(connConfig)
    console.log('Connected to MySQL/MariaDB successfully.')

    const columns = await conn.query('DESCRIBE Unit')
    console.log('Columns in Unit table:')
    console.table(columns.map((c: any) => ({
      Field: c.Field,
      Type: c.Type,
      Null: c.Null,
      Key: c.Key,
      Default: c.Default,
      Extra: c.Extra
    })))

    await conn.end()
  } catch (err) {
    console.error('Database connection or query failed:', err)
  }
}

main()
