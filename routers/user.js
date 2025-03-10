import db from "../db.js";
import express from "express";

const usersRouter = express();

usersRouter.get('/', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM users');
    stmt.all((err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  } catch (e) {
    res.status(500).send(e.message);
  }
});

export default usersRouter;
