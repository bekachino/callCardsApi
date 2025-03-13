import express from 'express';
import { ERROR_MESSAGES } from "../constants.js";
import db from "../db.js";

const actionsTreeRouter = express();

actionsTreeRouter.get('/reasons', (req, res) => {
  try {
    const sql = 'SELECT * FROM reasons';
    db.all(sql, [], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  } catch (e) {
    res.status(500).send(e.message);
  }
});

actionsTreeRouter.get('/solutions', (req, res) => {
  try {
    const sql = 'SELECT * FROM solutions';
    db.all(sql, [], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  } catch (e) {
    res.status(500).send(e.message);
  }
});

actionsTreeRouter.post('/create_reason', (req, res) => {
  try {
    const { title } = req.body;
    if (!title) return res.status(400).json({ error: 'Поле title обязательна' });
    
    const sql = 'INSERT INTO reasons (title) VALUES (?)';
    
    db.run(sql, [title], function (err) {
      if (err) return res.status(500).json({
        error: ERROR_MESSAGES[err.message] || err.message
      });
      res.json({
        id: this.lastID,
        title
      });
    });
  } catch (e) {
    res.send(e);
  }
});

actionsTreeRouter.post('/create_solution', (req, res) => {
  try {
    const {
      reason_id,
      title
    } = req.body;
    if (!reason_id || !title) return res.status(400).json({ error: 'Поля title и id причины обязательны' });
    
    const sql = 'INSERT INTO solutions (reason_id, title) VALUES (?, ?)';
    
    db.run(sql, [reason_id, title], function (err) {
      if (err) return res.status(500).json({
        error: ERROR_MESSAGES[err.message] || err.message
      });
      res.json({
        id: this.lastID,
        reason_id,
        title
      });
    });
  } catch (e) {
    res.send(e);
  }
});

export default actionsTreeRouter;
