// load modules
const express = require('express');
const handlebars = require('express-handlebars');
const mysql = require('mysql2/promise');

// configure port
const PORT = parseInt(process.argv[2]) || parseInt(process.env.PORT) || 3000;

// configure connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'playstore',
    connectionLimit: 4,
    timezone: '+08:00'
});

const router = require('./apps')(pool);

// create an instance for express
const app = express();

// configure handlebars
app.engine('hbs', handlebars({ defaultLayout: 'default.hbs' }));
app.set('view engine', 'hbs');

// application
app.use('/', router);
// app.use('/menu', router);

// start server
pool.getConnection()
    .then(conn => {
        console.info('Pinging database...');
        const p0 = Promise.resolve(conn);       // turn "conn" into a promise object
        const p1 = conn.ping();
        return Promise.all([ p0, p1 ]);
    })
    .then(results => {
        const conn = results[0];
        // release the connection
        conn.release();
        // start server
        app.listen(PORT, () => {
            console.info(`Application started on PORT ${PORT} at ${new Date()}`);
        });
    })
    .catch(e => {
        console.error('Unable to start server: ', e);
    });