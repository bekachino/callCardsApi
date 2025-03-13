import db from "../db.js";
import express from "express";

const usersRouter = express();

usersRouter.get('/', (req, res) => {
  try {
    const sql = 'SELECT * FROM users';
    db.all(sql, [], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  } catch (e) {
    res.status(500).send(e.message);
  }
});

usersRouter.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) res.status(404).json({ error: 'Отсутсвует id пользователя' });
    
    const sql = 'DELETE FROM users WHERE id=?';
    db.run(sql, [id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(200).json({ message: 'Пользователь удалён' })
    });
  } catch (e) {
    res.status(500).send(e.message);
  }
});

export default usersRouter;
