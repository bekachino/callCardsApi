import db from "../db.js";
import express from "express";
import { ERROR_MESSAGES, initialGetCardsSql } from "../constants.js";
import getBalances from "../utils/hydraConnection.js";
import { createDeal } from "../utils/createDeal.js";

const cardsRouter = express();

const formatRepeatedCalls = rawData => {
  const grouped = {};
  
  rawData.forEach(item => {
    const key = `${item.ls_abon}|${item.reason?.title}|${item.solution?.title || 'null'}`;
    
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
  
  return Object.values(grouped).filter(item => item?.count > 1);
};

cardsRouter.get('/', (req, res) => {
  try {
    const {
      page = '1',
      page_size = '100',
      start_date,
      end_date,
      reason,
      solution,
      sip = [],
    } = req.query;
    
    const reasonIds = typeof reason === 'string' ? reason.split(',') : reason;
    const solutionIds = typeof solution === 'string' ? solution.split(',') : solution;
    const sipList = typeof sip === 'string' ? sip.split(',') : sip;
    
    const isUser = req.user?.role === 'user';
    const pageNum = parseInt(page) || 1;
    const pageSize = parseInt(page_size) || 100;
    
    let sql = `${initialGetCardsSql}`;
    let whereClauses = [];
    let sqlParams = [];
    
    if (start_date) {
      whereClauses.push('C.created_at >= ?');
      sqlParams.push(start_date);
    }
    if (end_date) {
      whereClauses.push('C.created_at <= ?');
      sqlParams.push(end_date);
    }
    
    if (isUser && req.user?.sip) {
      whereClauses.push('C.sip = ?');
      sqlParams.push(req.user.sip);
    }
    
    if (Array.isArray(reasonIds) && reasonIds.length > 0) {
      const placeholders = reasonIds.map(() => '?').join(', ');
      whereClauses.push(`C.reason_id IN (${placeholders})`);
      sqlParams.push(...reasonIds);
    }
    
    if (Array.isArray(solutionIds) && solutionIds.length > 0) {
      const placeholders = solutionIds.map(() => '?').join(', ');
      whereClauses.push(`C.solution_id IN (${placeholders})`);
      sqlParams.push(...solutionIds);
    }
    
    if (Array.isArray(sipList) && sipList.length > 0) {
      const placeholders = sipList.map(() => '?').join(', ');
      whereClauses.push(`C.sip IN (${placeholders})`);
      sqlParams.push(...sipList);
    }
    
    if (whereClauses.length > 0) {
      sql += '\nWHERE ' + whereClauses.join(' AND ');
    }
    
    db.all(sql, sqlParams, (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      
      const total_results = rows.length;
      const total_pages = Math.ceil(total_results / pageSize);
      const paginatedResults = rows.reverse().slice((
        pageNum - 1
      ) * pageSize, pageNum * pageSize);
      
      const formattedResults = paginatedResults.map(row => (
        {
          ...row,
          phone_number: JSON.parse(row.phone_number),
          senior_specs: JSON.parse(row.senior_specs) || [],
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
      
      res.json({
        total_results,
        total_pages,
        result: formattedResults
      });
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
    const isUser = req.user?.role === 'user';
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
      res.json(Object.keys(result).reverse().map(key => (
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
    const isUser = req.user?.role === 'user';
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
      res.json(Object.keys(result).reverse().map(key => (
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
    const isUser = req.user?.role === 'user';
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
      res.json(Object.keys(result).reverse().map(sipKey => result[sipKey]));
    });
  } catch (e) {
    res.status(500).send(e.message);
  }
});

cardsRouter.get('/repeated_calls', (req, res) => {
  try {
    const {
      page = '1',
      page_size = '100',
      start_date,
      end_date,
      reason,
      solution
    } = req.query;
    const isUser = req.user?.role === 'user';
    const reasonIds = typeof reason === 'string' ? reason.split(',') : reason;
    const solutionIds = typeof solution === 'string' ? solution.split(',') : solution;
    
    const pageNum = parseInt(page) || 1;
    const pageSize = parseInt(page_size) || 100;
    
    let sql = `${initialGetCardsSql}`;
    let whereClauses = [];
    let sqlParams = [];
    
    if (start_date) {
      whereClauses.push('C.created_at >= ?');
      sqlParams.push(start_date);
    }
    if (end_date) {
      whereClauses.push('C.created_at <= ?');
      sqlParams.push(end_date);
    }
    
    if (isUser && req.user?.sip) {
      whereClauses.push('C.sip = ?');
      sqlParams.push(req.user.sip);
    }
    
    if (Array.isArray(reasonIds) && reasonIds.length > 0) {
      const placeholders = reasonIds.map(() => '?').join(', ');
      whereClauses.push(`C.reason_id IN (${placeholders})`);
      sqlParams.push(...reasonIds);
    }
    
    if (Array.isArray(solutionIds) && solutionIds.length > 0) {
      const placeholders = solutionIds.map(() => '?').join(', ');
      whereClauses.push(`C.solution_id IN (${placeholders})`);
      sqlParams.push(...solutionIds);
    }
    
    if (whereClauses.length > 0) {
      sql += '\nWHERE ' + whereClauses.join(' AND ');
    }
    
    db.all(sql, sqlParams, (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      
      const rawData = rows.reverse().map(row => (
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
      
      const total_results = groupedData.length;
      const total_pages = Math.ceil(total_results / pageSize);
      const paginatedResults = groupedData.slice((
        pageNum - 1
      ) * pageSize, pageNum * pageSize);
      res.json({
        total_results,
        total_pages,
        result: paginatedResults,
      });
    });
  } catch (e) {
    res.status(500).send(e.message);
  }
});

cardsRouter.get('/inactives', async (req, res) => {
  try {
    const {
      start_date,
      end_date,
      reason,
      solution,
      sip = [],
    } = req.query;
    
    const reasonIds = typeof reason === 'string' ? reason.split(',') : reason;
    const solutionIds = typeof solution === 'string' ? solution.split(',') : solution;
    const sipList = typeof sip === 'string' ? sip.split(',') : sip;
    
    const isUser = req.user?.role === 'user';
    let sql = `${initialGetCardsSql}`;
    let whereClauses = [];
    let sqlParams = [];
    
    if (start_date) {
      whereClauses.push('C.created_at >= ?');
      sqlParams.push(start_date);
    }
    if (end_date) {
      whereClauses.push('C.created_at <= ?');
      sqlParams.push(end_date);
    }
    
    if (isUser && req.user?.sip) {
      whereClauses.push('C.sip = ?');
      sqlParams.push(req.user.sip);
    }
    
    if (Array.isArray(reasonIds) && reasonIds.length > 0) {
      const placeholders = reasonIds.map(() => '?').join(', ');
      whereClauses.push(`C.reason_id IN (${placeholders})`);
      sqlParams.push(...reasonIds);
    }
    
    if (Array.isArray(solutionIds) && solutionIds.length > 0) {
      const placeholders = solutionIds.map(() => '?').join(', ');
      whereClauses.push(`C.solution_id IN (${placeholders})`);
      sqlParams.push(...solutionIds);
    }
    
    if (Array.isArray(sipList) && sipList.length > 0) {
      const placeholders = sipList.map(() => '?').join(', ');
      whereClauses.push(`C.sip IN (${placeholders})`);
      sqlParams.push(...sipList);
    }
    
    if (whereClauses.length > 0) {
      sql += '\nWHERE ' + whereClauses.join(' AND ');
    }
    
    db.all(sql, sqlParams, async (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      
      const accountIds = rows.reverse().map(abon => abon?.account_id);
      const balances = await getBalances(accountIds);
      const abonsWithBalance = rows.map(abon => {
        const balance = balances.find(abonResult => `${abonResult[0]}` === `${abon?.account_id}`)?.[1];
        return {
          ...abon,
          balance,
        };
      });
      const inactives = abonsWithBalance.filter(abon => abon?.balance < 0).map(abon => (
        {
          ...abon,
          phone_number: JSON.parse(abon.phone_number),
          senior_specs: JSON.parse(abon.senior_specs),
          reason: abon.reason_id ? {
            id: abon.reason_id,
            title: abon.reason_title
          } : null,
          solution: abon.solution_id ? {
            id: abon.solution_id,
            title: abon.solution_title
          } : null,
        }
      ));
      res.json(inactives);
    });
  } catch (e) {
    console.log(e, 1);
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
    
    // Find all checked-in senior specialists
    const findSeniorSpecsSql = `
      SELECT u.*
      FROM users u
      LEFT JOIN checkins c ON u.id = c.user_id AND c.check_out_time IS NULL
      WHERE u.is_senior_spec = 1 AND c.id IS NOT NULL
    `;
    
    db.all(findSeniorSpecsSql, [], (err, seniorSpecs) => {
      if (err) return res.status(500).json({ error: err.message });
      
      const seniorSpecNames = (
        seniorSpecs || []
      ).map(user => `${user.full_name} (${user.sip})`);
      
      const sql = `
        INSERT INTO cards
        (ls_abon, phone_number, call_from, sip, spec_full_name, full_name, address, account_id, n_result_id, mac_address, ip_address, mac_onu, ip_olt, reason_id, solution_id, comment, senior_specs)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
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
        JSON.stringify(seniorSpecNames || []),
      ], function (err) {
        if (err) return res.status(500).json({
          error: ERROR_MESSAGES[err.message] || err.message
        });
        
        db.get('select * from reasons where id = ?', [reason_id], (err, reason_result) => {
          if (err) return res.status(500).json({ error: err.message });
          
          db.get('select * from solutions where id = ?', [solution_id], async (err, solution_result) => {
            if (err) return res.status(500).json({ error: err.message });
            
            if (solution_result?.title.includes('перезвон')) {
              await createDeal({
                full_name,
                spec_full_name,
                address,
                ls_abon,
                phone_number,
                comment,
                reason: reason_result?.title || '',
                solution: solution_result?.title || '',
              });
            }
          });
        });
        
        res.json({
          id: this.lastID,
          assigned_senior_specs: seniorSpecNames
        });
      });
    });
  } catch (e) {
    res.status(500).send(e.message);
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
