import db from "../db.js";
import express from "express";
import {
  authorize,
  ERROR_MESSAGES,
  initialGetCardsSql,
  token
} from "../constants.js";
import axios from "axios";

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

const getAbonBalance = async (account_id, n_result_id) => {
  try {
    const reqToBalance = await axios(`https://hydra.snt.kg:8000/rest/v2/subjects/customers/${n_result_id}/accounts/${account_id}`, {
      headers: {
        Authorization: `Token token=${token}`
      }
    });
    
    const balance = reqToBalance?.data?.account?.n_sum_bal;
    if (!!balance) return parseFloat(balance);
  } catch (e) {
    return {
      message: e.message,
      url: e.config.url,
      status: 403
    };
  }
};

cardsRouter.get('/', (req, res) => {
  try {
    const {
      start_date,
      end_date
    } = req.query;
    const isUser = req.user.role === 'user';
    
    let sql;
    let sqlParams = [];
    
    if (!start_date && !end_date) {
      sql = `
        ${initialGetCardsSql}
      `;
    } else {
      sql = `
        ${initialGetCardsSql}
        WHERE ${!!start_date ? 'C.created_at >= ?' : ''} ${!!start_date && !!end_date ? 'AND' : ''} ${!!end_date ? 'C.created_at <= ?' : ''}
      `;
      if (!!start_date) sqlParams.push(start_date);
      if (!!end_date) sqlParams.push(end_date);
    }
    if (isUser && !!req.user.sip) {
      sql += isUser ? `\nWHERE C.sip = ?` : ''
      sqlParams.push(req.user.sip);
    }
    
    db.all(sql, sqlParams, (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows.map(row => (
        {
          ...row,
          phone_number: JSON.parse(row.phone_number),
          reason: row.reason_id ? {
            id: row.reason_id,
            title: row.reason_title
          } : null,
          solution: row.solution_id ? {
            id: row.solution_id,
            title: row.solution_title
          } : null,
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
    const isUser = req.user.role === 'user';
    let sql;
    let sqlParams = [];
    const result = {};
    
    if (!start_date && !end_date) {
      sql = initialGetCardsSql;
    } else {
      sql = `
        ${initialGetCardsSql}
        WHERE ${!!start_date ? 'C.created_at >= ?' : ''} ${!!start_date && !!end_date ? 'AND' : ''} ${!!end_date ? 'C.created_at <= ?' : ''}
      `;
      if (!!start_date) sqlParams.push(start_date);
      if (!!end_date) sqlParams.push(end_date);
    }
    if (isUser && !!req.user.sip) {
      sql += isUser ? `\nWHERE C.sip = ?` : ''
      sqlParams.push(req.user.sip);
    }
    
    db.all(sql, sqlParams, (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      rows.forEach(card => {
        !!result[card.reason_title] ? result[card.reason_title]++ : result[card.reason_title] = 1;
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
    const isUser = req.user.role === 'user';
    let sql;
    let sqlParams = [];
    const result = {};
    
    if (!start_date && !end_date) {
      sql = initialGetCardsSql;
    } else {
      sql = `
        ${initialGetCardsSql}
        WHERE ${!!start_date ? 'C.created_at >= ?' : ''} ${!!start_date && !!end_date ? 'AND' : ''} ${!!end_date ? 'C.created_at <= ?' : ''}
      `;
      if (!!start_date) sqlParams.push(start_date);
      if (!!end_date) sqlParams.push(end_date);
    }
    if (isUser && !!req.user.sip) {
      sql += isUser ? `\nWHERE C.sip = ?` : ''
      sqlParams.push(req.user.sip);
    }
    
    db.all(sql, sqlParams, (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      rows.forEach(card => {
        !!result[card.solution_title] ? result[card.solution_title].count++ : result[card.solution_title] = {
          reason: card.reason_id ? {
            id: card.reason_id,
            title: card.reason_title
          } : null,
          solution: card.solution_id ? {
            id: card.solution_id,
            title: card.solution_title
          } : null,
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
    const isUser = req.user.role === 'user';
    let sql;
    let sqlParams = [];
    const result = {};
    
    if (!start_date && !end_date) {
      sql = initialGetCardsSql;
    } else {
      sql = `
        ${initialGetCardsSql}
        WHERE ${!!start_date ? 'C.created_at >= ?' : ''} ${!!start_date && !!end_date ? 'AND' : ''} ${!!end_date ? 'C.created_at <= ?' : ''}
      `;
      if (!!start_date) sqlParams.push(start_date);
      if (!!end_date) sqlParams.push(end_date);
    }
    if (isUser && !!req.user.sip) {
      sql += isUser ? `\nWHERE C.sip = ?` : ''
      sqlParams.push(req.user.sip);
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
    const isUser = req.user.role === 'user';
    let sql;
    let sqlParams = [];
    
    if (!start_date && !end_date) {
      sql = initialGetCardsSql;
    } else {
      sql = `
        ${initialGetCardsSql}
        WHERE ${!!start_date ? 'C.created_at >= ?' : ''} ${!!start_date && !!end_date ? 'AND' : ''} ${!!end_date ? 'C.created_at <= ?' : ''}
      `;
      if (!!start_date) sqlParams.push(start_date);
      if (!!end_date) sqlParams.push(end_date);
    }
    if (isUser && !!req.user.sip) {
      sql += isUser ? `\nWHERE C.sip = ?` : ''
      sqlParams.push(req.user.sip);
    }
    
    db.all(sql, sqlParams, (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      
      const rawData = rows.map(row => (
        {
          ...row,
          phone_number: JSON.parse(row.phone_number),
          reason: row.reason_id ? {
            id: row.reason_id,
            title: row.reason_title
          } : null,
          solution: row.solution_id ? {
            id: row.solution_id,
            title: row.solution_title
          } : null,
        }
      ));
      const groupedData = formatRepeatedCalls(rawData);
      res.send(groupedData);
    });
  } catch (e) {
    res.status(500).send(e.message);
  }
});

cardsRouter.get('/inactives', async (req, res) => {
  try {
    const {
      start_date,
      end_date
    } = req.query;
    const isUser = req.user.role === 'user';
    let sql;
    let sqlParams = [];
    
    if (!start_date && !end_date) {
      sql = initialGetCardsSql;
    } else {
      sql = `
        ${initialGetCardsSql}
        WHERE ${!!start_date ? 'C.created_at >= ?' : ''} ${!!start_date && !!end_date ? 'AND' : ''} ${!!end_date ? 'C.created_at <= ?' : ''}
      `;
      if (!!start_date) sqlParams.push(start_date);
      if (!!end_date) sqlParams.push(end_date);
    }
    if (isUser && !!req.user.sip) {
      sql += isUser ? `\nWHERE C.sip = ?` : ''
      sqlParams.push(req.user.sip);
    }
    
    db.all(sql, sqlParams, async (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      const data = rows.map(row => (
        {
          ...row,
          phone_number: JSON.parse(row.phone_number),
          reason: row.reason_id ? {
            id: row.reason_id,
            title: row.reason_title
          } : null,
          solution: row.solution_id ? {
            id: row.solution_id,
            title: row.solution_title
          } : null,
        }
      ));
      
      const inactives = await Promise.all(data.map(async abon => {
        let isPositiveBalance = false;
        if (!!abon.account_id && !!abon.n_result_id) {
          let balance = await getAbonBalance(abon.account_id, abon.n_result_id);
          
          if (balance?.status === 403) {
            console.log("Срок действия токена истёк. Идёт переавторизация...");
            const token = await authorize();
            if (!token) {
              return res.status(500).send("Авторизация не удалась");
            }
            balance = await getAbonBalance(abon.account_id, abon.n_result_id);
          }
          isPositiveBalance = balance >= 0;
        } else isPositiveBalance = false;
        return isPositiveBalance ? null : abon;
      }));
      res.status(200).send(inactives.filter(inactive => !!inactive));
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
      call_from,
      sip,
      spec_full_name,
      full_name,
      address,
      account_id,
      n_result_id,
      mac_address,
      ip_address,
      mac_onu,
      ip_olt,
      reason_id,
      solution_id,
      comment = ''
    } = req.body;
    if (!ls_abon || (
      !phone_number || !!phone_number && !Array.isArray(phone_number)
    ) || !sip || !spec_full_name || !full_name || !address || !reason_id) return res.status(400)
    .json({
      error: 'Поля ls_abon, phone_number, sip, spec_full_name, full_name, address, reason_id обязательны'
    });
    const sql = 'INSERT INTO cards (ls_abon, phone_number, call_from, sip, spec_full_name, full_name, address, account_id, n_result_id, mac_address, ip_address, mac_onu, ip_olt, reason_id, solution_id, comment) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    
    db.run(sql, [
      ls_abon,
      JSON.stringify(phone_number),
      call_from,
      sip,
      spec_full_name,
      full_name,
      address,
      account_id || '',
      n_result_id || '',
      mac_address || '',
      ip_address || '',
      mac_onu || '',
      ip_olt || '',
      reason_id,
      solution_id,
      comment || '',
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
