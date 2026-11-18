require('dotenv').config();

module.exports = {
  port: Number(process.env.PORT || 5000),
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'shopease_db',
    waitForConnections: true,
    connectionLimit: 10,
    decimalNumbers: true,
    charset: 'utf8mb4'
  },
  jwtSecret: process.env.JWT_SECRET || 'shopease_dev_secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d'
};
