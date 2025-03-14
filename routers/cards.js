import db from "../db.js";
import express from "express";
import { ERROR_MESSAGES } from "../constants.js";

const cardsRouter = express();

cardsRouter.get('/', (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    let sql;
    let sqlParams = [];
    
    if (!start_date && !end_date) {
      sql = 'SELECT * FROM cards';
    } else {
      sql = `SELECT * FROM cards WHERE ${!!start_date ? 'created_at >= ?' : ''} ${!!start_date && !!end_date ? 'AND' : ''} ${!!end_date ? 'created_at <= ?' : ''}`;
      if (!!start_date) sqlParams.push(start_date);
      if (!!end_date) sqlParams.push(end_date);
    }
    
    db.all(sql, sqlParams, (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  } catch (e) {
    res.status(500).send(e.message);
  }
});

cardsRouter.post('/create_card', (req, res) => {
  try {
    const {
      ls_abon,
      phone_number,
      sip,
      spec_full_name,
      full_name,
      address,
      reason_id,
      solution_id,
      comment
    } = req.body;
    if (!ls_abon || !phone_number || !sip || !spec_full_name || !full_name || !address || !reason_id || !solution_id) return res.status(400)
    .json({
      error: 'Поля ls_abon, phone_number, sip, spec_full_name, full_name, address, reason_id, solution_id обязательны'
    });
    const sql = 'INSERT INTO cards (ls_abon, phone_number, sip, spec_full_name, full_name, address, reason_id, solution_id, comment) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    
    db.run(sql, [
      ls_abon,
      phone_number,
      sip,
      spec_full_name,
      full_name,
      address,
      reason_id,
      solution_id,
      comment
    ], function (err) {
      if (err) return res.status(500).json({
        error: ERROR_MESSAGES[err.message] || err.message
      });
      res.json({
        id: this.lastID,
      });
    });
  } catch (e) {
    res.send(e);
  }
});

cardsRouter.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) res.status(404).json({ error: 'Отсутсвует id пользователя' });
    
    const sql = 'DELETE FROM cards WHERE id=?';
    db.run(sql, [id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(200).json({ message: 'Запись удалёна' })
    });
  } catch (e) {
    res.status(500).send(e.message);
  }
});

export default cardsRouter;
