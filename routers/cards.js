import db from "../db.js";
import express from "express";
import { ERROR_MESSAGES, initialGetCardsSql } from "../constants.js";

const cardsRouter = express();

const formatRepeatedCalls = rawData => {
  const grouped = {};
  
  rawData.forEach(item => {
    const key = `${item.ls_abon}|${item.reason}|${item.solution || 'null'}`;
    
    if (!grouped[key]) {
      grouped[key] = {
        count: 0,
        ls_abon: item.ls_abon,
        address: item.address,
        phone_number: item.phone_number,
        reason: item.reason,
        solution: item.solution || null,
      };
    }
    
    grouped[key].count += 1;
  });
  
  return Object.values(grouped);
};

cardsRouter.get('/', (req, res) => {
  try {
    const {
      start_date,
      end_date
    } = req.query;
    
    let sql;
    let sqlParams = [];
    
    if (!start_date && !end_date) {
      sql = initialGetCardsSql;
    } else {
      sql = `
        select
         C.id,
         C.ls_abon,
         C.created_at,
         C.spec_full_name,
         C.sip,
         C.full_name,
         C.phone_number,
         C.address,
         C.comment,
         R.title as reason, S.title as solution from cards as C
        left join reasons as R on R.id = C.reason_id
        left join solutions as S on S.id = C.solution_id
        WHERE ${!!start_date ? 'C.created_at >= ?' : ''} ${!!start_date && !!end_date ? 'AND' : ''} ${!!end_date ? 'C.created_at <= ?' : ''}
      `;
      if (!!start_date) sqlParams.push(start_date);
      if (!!end_date) sqlParams.push(end_date);
    }
    
    db.all(sql, sqlParams, (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows.map(row => (
        {
          ...row,
          phone_number: JSON.parse(row.phone_number)
        }
      )));
    });
  } catch (e) {
    res.status(500).send(e.message);
  }
});

cardsRouter.get('/stats_by_reason', (req, res) => {
  try {
    const {
      start_date,
      end_date
    } = req.query;
    let sql;
    let sqlParams = [];
    const result = {};
    
    if (!start_date && !end_date) {
      sql = initialGetCardsSql;
    } else {
      sql = `
        select
         C.id,
         C.ls_abon,
         C.created_at,
         C.spec_full_name,
         C.sip,
         C.full_name,
         C.phone_number,
         C.address,
         C.comment,
         R.title as reason, S.title as solution from cards as C
        left join reasons as R on R.id = C.reason_id
        left join solutions as S on S.id = C.solution_id
        WHERE ${!!start_date ? 'C.created_at >= ?' : ''} ${!!start_date && !!end_date ? 'AND' : ''} ${!!end_date ? 'C.created_at <= ?' : ''}
      `;
      if (!!start_date) sqlParams.push(start_date);
      if (!!end_date) sqlParams.push(end_date);
    }
    
    db.all(sql, sqlParams, (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      rows.forEach(card => {
        !!result[card.reason] ? result[card.reason]++ : result[card.reason] = 1;
      });
      res.json(Object.keys(result).map(key => (
        {
          reason: key,
          count: result[key]
        }
      )));
    });
  } catch (e) {
    res.status(500).send(e.message);
  }
});

cardsRouter.get('/stats_by_solution', (req, res) => {
  try {
    const {
      start_date,
      end_date
    } = req.query;
    let sql;
    let sqlParams = [];
    const result = {};
    
    if (!start_date && !end_date) {
      sql = initialGetCardsSql;
    } else {
      sql = `
        select
         C.id,
         C.ls_abon,
         C.created_at,
         C.spec_full_name,
         C.sip,
         C.full_name,
         C.phone_number,
         C.address,
         C.comment,
         R.title as reason, S.title as solution from cards as C
        left join reasons as R on R.id = C.reason_id
        left join solutions as S on S.id = C.solution_id
        WHERE ${!!start_date ? 'C.created_at >= ?' : ''} ${!!start_date && !!end_date ? 'AND' : ''} ${!!end_date ? 'C.created_at <= ?' : ''}
      `;
      if (!!start_date) sqlParams.push(start_date);
      if (!!end_date) sqlParams.push(end_date);
    }
    
    db.all(sql, sqlParams, (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      rows.forEach(card => {
        !!result[card.solution] ? result[card.solution].count++ : result[card.solution] = {
          reason: card.reason,
          solution: card.solution,
          count: 1,
        };
      });
      res.json(Object.keys(result).map(key => (
        {
          ...result[key]
        }
      )));
    });
  } catch (e) {
    res.status(500).send(e.message);
  }
});

cardsRouter.get('/report', (req, res) => {
  try {
    const {
      start_date,
      end_date
    } = req.query;
    
    let sql;
    let sqlParams = [];
    const result = {};
    
    if (!start_date && !end_date) {
      sql = initialGetCardsSql;
    } else {
      sql = `
        select
         C.id,
         C.ls_abon,
         C.created_at,
         C.spec_full_name,
         C.sip,
         C.full_name,
         C.phone_number,
         C.address,
         C.comment,
         R.title as reason, S.title as solution from cards as C
        left join reasons as R on R.id = C.reason_id
        left join solutions as S on S.id = C.solution_id
        WHERE ${!!start_date ? 'C.created_at >= ?' : ''} ${!!start_date && !!end_date ? 'AND' : ''} ${!!end_date ? 'C.created_at <= ?' : ''}
      `;
      if (!!start_date) sqlParams.push(start_date);
      if (!!end_date) sqlParams.push(end_date);
    }
    
    db.all(sql, sqlParams, (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      rows.forEach(card => {
        if (!result[card.sip]) {
          result[card.sip] = {
            sip: card.sip,
            spec_full_name: card.spec_full_name,
            count: 1,
          };
        } else {
          result[card.sip].count++;
        }
      });
      res.json(Object.keys(result).map(sipKey => result[sipKey]));
    });
  } catch (e) {
    res.status(500).send(e.message);
  }
});

cardsRouter.get('/repeated_calls', (req, res) => {
  try {
    const {
      start_date,
      end_date
    } = req.query;
    
    let sql;
    let sqlParams = [];
    
    if (!start_date && !end_date) {
      sql = initialGetCardsSql;
    } else {
      sql = `
        select
         C.id,
         C.ls_abon,
         C.created_at,
         C.spec_full_name,
         C.sip,
         C.full_name,
         C.phone_number,
         C.address,
         C.comment,
         R.title as reason, S.title as solution from cards as C
        left join reasons as R on R.id = C.reason_id
        left join solutions as S on S.id = C.solution_id
        WHERE ${!!start_date ? 'C.created_at >= ?' : ''} ${!!start_date && !!end_date ? 'AND' : ''} ${!!end_date ? 'C.created_at <= ?' : ''}
      `;
      if (!!start_date) sqlParams.push(start_date);
      if (!!end_date) sqlParams.push(end_date);
    }
    
    db.all(sql, sqlParams, (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      
      const rawData = rows.map(row => (
        {
          ...row,
          phone_number: JSON.parse(row.phone_number)
        }
      ));
      const groupedData = formatRepeatedCalls(rawData);
      res.send(groupedData);
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
    if (!ls_abon || !phone_number || !sip || !spec_full_name || !full_name || !address || !reason_id) return res.status(400)
    .json({
      error: 'Поля ls_abon, phone_number, sip, spec_full_name, full_name, address, reason_id обязательны'
    });
    const sql = 'INSERT INTO cards (ls_abon, phone_number, sip, spec_full_name, full_name, address, reason_id, solution_id, comment) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    
    db.run(sql, [
      ls_abon,
      JSON.stringify(phone_number),
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
    
    if (!id) res.status(404).json({ error: 'Отсутсвует id записи' });
    
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
