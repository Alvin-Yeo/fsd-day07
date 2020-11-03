// load express
const express = require('express');

// SQL
const SQL_GET_APP_CATEGORIES = 'select distinct(category) from apps';
const SQL_GET_APPS = 'select app_id, name from apps limit ? offset ?';
const SQL_GET_APP_BY_APPID = 'select * from apps where app_id = ?';

const r = (pool) => {
    const router = express.Router();

    router.get('/', async (req, res) => {
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

    router.get('/app/:appid', async (req, res) => {
        const appid = req.params['appid'];

        const conn = await pool.getConnection();

        try {
            const results = await conn.query(SQL_GET_APP_BY_APPID, [appid]);
            const recs = results[0];

            if(recs.length <= 0) {
                // Error 404
                res.status(404);
                res.type('text/html');
                res.send(`Not found: ${appid}`);
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

    router.get('/category', async (req, res) => {
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

    return router;
};

module.exports = r;