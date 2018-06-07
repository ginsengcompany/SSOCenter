module.exports = {
  sql: {
    database: 'SSO',
    username: 'postgres',
    password: 'admin',
    dialect: 'postgres', // PostgreSQL, MySQL, MariaDB, SQLite and MSSQL See more: http://docs.sequelizejs.com/en/latest/
    logging: true,
    timezone: '+02:00',
    port: '5432'
  },
  mongo: {
    uri: 'mongodb://localhost:27017/SSO'
  },
  seedDB:false,
  seedMongoDB:false,
  seedDBForce:true,
  db:'mongo' // mongo,sql if you want to use any SQL change dialect above in sql config
}