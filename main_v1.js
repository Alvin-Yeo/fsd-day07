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

// SQL
const SQL_GET_APP_CATEGORIES = 'select distinct(category) from apps';
const SQL_GET_APPS = 'select app_id, name from apps limit ? offset ?';
const SQL_GET_APP_BY_APPID = 'select * from apps where app_id = ?';

// create an instance for express
const app = express();

// configure handlebars
app.engine('hbs', handlebars({ defaultLayout: 'default.hbs' }));
app.set('view engine', 'hbs');

// configure routes
app.get('/', async (req, res) => {
    const conn = await pool.getConnection();

    try {
        const results = await conn.query(SQL_GET_APPS, [20, 0]);
        const apps = results[0];

        res.status(200);
        res.type('text/html');
        res.render('index', { apps });
    } catch(e) {
        res.status(500);
        res.type('text/html');
        res.send(JSON.stringify(e));
    } finally {
        conn.release();
    }
});

app.get('/app/:appid', async (req, res) => {
    const appid = req.params['appid'];

    const conn = await pool.getConnection();

    try {
        const results = await conn.query(SQL_GET_APP_BY_APPID, [appid]);
        const recs = results[0];

        if(recs.length <= 0) {
            // Error 404
            res.status(404);
            res.type('text/html');
            res.send('Not found: ', appid);
            return;
        }

        res.status(200);
        res.format({
            'text/html': () => {
                res.type('text/html');
                res.render('app', { app: recs[0] });
            },
            'application/json': () => {
                res.type('application/json');
                res.json(recs[0]);
            },
            'default': () => {
                res.type('text/plain');
                res.send(JSON.stringify(recs[0]));
            }
        });
        
    } catch(e) {
        res.status(500);
        res.type('text/html');
        res.send(JSON.stringify(e));
    } finally {
        conn.release();
    }
});

app.get('/category', async (req, res) => {
    const conn = await pool.getConnection();

    try {
        const results = await conn.query(SQL_GET_APP_CATEGORIES);
        const cats = results[0];

        res.status(200);
        res.type('text/html');
        res.render('category', { category: cats });
    } catch(e) {
        res.status(500);
        res.type('text/html');
        res.send(JSON.stringify(e));
    } finally {
        conn.release();
    }
});

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
    })