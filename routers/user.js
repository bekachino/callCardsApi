import db from "../db.js";
import express from "express";
import dayjs from "dayjs";
import bcrypt from "bcryptjs";

const usersRouter = express();

usersRouter.get('/', (req, res) => {
  try {
    const sql = `
      SELECT
        u.*,
        CASE
          WHEN uc.id IS NOT NULL AND uc.check_out_time IS NULL THEN 1
          ELSE 0
        END AS checked_in
      FROM users u
      LEFT JOIN checkins uc ON u.id = uc.user_id AND uc.check_out_time IS NULL
    `;
    db.all(sql, [], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      
      const users = rows.map(row => (
        {
          ...row,
          checked_in: !!row.checked_in,
        }
      ));
      
      res.json(users);
    });
  } catch (e) {
    res.status(500).send(e.message);
  }
});

usersRouter.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const sql = `
      SELECT
        u.*,
        CASE WHEN uc.id IS NOT NULL THEN 1 ELSE 0 END as checked_in
      FROM users u
      LEFT JOIN checkins uc ON u.id = uc.user_id AND uc.check_out_time IS NULL
      WHERE u.id = ?
    `;
    db.all(sql, [id], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      
      const users = rows.map(row => (
        {
          ...row,
          checked_in: !!row.checked_in,
          role: !!row.is_senior_spec ? 'senior_spec' : row.role,
        }
      ));
      
      res.json(users);
    });
  } catch (e) {
    res.status(500).send(e.message);
  }
});

usersRouter.put('/:id', async (req, res) => {
  const { id } = req.params;
  const {
    username,
    full_name,
    role,
    password,
    sip,
    phone_number
  } = req.body;
  
  if (!username || !full_name || !role || !sip || !phone_number) {
    return res.status(400).json({ message: "Все поля, за исключением пароля, обязательны" });
  }
  
  const is_senior_spec = role === 'senior_spec';
  
  try {
    let sql, params;
    
    if (password && password.trim() !== "") {
      const hashedPassword = await bcrypt.hash(password, 10);
      sql = `
        UPDATE users
        SET username = ?, full_name = ?, role = ?, password = ?, sip = ?, phone_number = ?, is_senior_spec = ?
        WHERE id = ?
      `;
      params = [
        username,
        full_name,
        is_senior_spec ? 'user' : role,
        hashedPassword,
        sip,
        phone_number,
        is_senior_spec ? 1 : 0,
        id
      ];
    } else {
      sql = `
        UPDATE users
        SET username = ?, full_name = ?, role = ?, sip = ?, phone_number = ?, is_senior_spec = ?
        WHERE id = ?
      `;
      params = [
        username,
        full_name,
        is_senior_spec ? 'user' : role,
        sip,
        phone_number,
        is_senior_spec ? 1 : 0,
        id
      ];
    }
    
    db.run(sql, params, function (err) {
      if (err) {
        return res.status(500).json({ message: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ message: "Пользователь не найден" });
      }
      res.json({ message: "Пользователь обновлен" });
    });
  } catch (error) {
    res.status(500).json({ message: "Ошибка сервера" });
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

usersRouter.post('/:id/check_in', (req, res) => {
  const userId = req.params.id;
  const checkInTime = dayjs().format('YYYY-MM-DD HH:mm');
  
  const checkSql = `
    SELECT 1 FROM checkins
    WHERE user_id = ? AND check_out_time IS NULL
    LIMIT 1
  `;
  
  db.get(checkSql, [userId], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    
    if (row) {
      return res.status(400).json({ error: 'Вы не завершили предыдущую смену' });
    }
    
    const insertSql = `
      INSERT INTO checkins (user_id, check_in_time)
      VALUES (?, ?)
    `;
    db.run(insertSql, [
      userId,
      checkInTime
    ], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({
        message: 'Смена начата',
        checkInId: this.lastID
      });
    });
  });
});

usersRouter.post('/:id/check_out', (req, res) => {
  const userId = req.params.id;
  const checkOutTime = dayjs().format('YYYY-MM-DD HH:mm');
  
  const sql = `
    UPDATE checkins
    SET check_out_time = ?
    WHERE user_id = ? AND check_out_time IS NULL
  `;
  db.run(sql, [
    checkOutTime,
    userId
  ], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(400).json({ error: 'Смена для завершения не найдена' });
    res.json({ message: 'Смена завершена' });
  });
});

export default usersRouter;
