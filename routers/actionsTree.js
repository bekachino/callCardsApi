import express from 'express';
import { ERROR_MESSAGES } from "../constants.js";
import db from "../db.js";

const actionsTreeRouter = express();

actionsTreeRouter.get('/reasons', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM reasons');
    stmt.all((err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  } catch (e) {
    res.status(500).send(e.message);
  }
});

actionsTreeRouter.get('/solutions', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM solutions');
    stmt.all((err, rows) => {
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
    if (!title) return res.status(400).json({ error: 'Title is required' });
    
    const stmt = db.prepare('INSERT INTO reasons (title) VALUES (?)');
    stmt.run(title, function (err) {
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
    if (!reason_id || !title) return res.status(400).json({ error: 'reason_id and title are required' });
    
    const stmt = db.prepare('INSERT INTO solutions (reason_id, title) VALUES (?, ?)');
    stmt.run(reason_id, title, function (err) {
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
