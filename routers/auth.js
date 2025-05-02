import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../db.js";
import * as dotenv from "dotenv";
import auth from "../middleware/auth.js";

dotenv.config();

const authRouter = express.Router();
const SECRET_KEY = process.env.SECRET_KEY;

authRouter.post("/sign-up", auth, async (req, res) => {
  const {
    username,
    full_name,
    role = 'user',
    password,
    sip,
    phone_number
  } = req.body;
  
  if (!['admin'].includes(req?.user) || !req?.is_senior_spec) return res.status(401);
  
  if (!username || !full_name || !role || !password || !sip || !phone_number) {
    return res.status(400).json({
      message: "Имя пользователя, ФИО, СИП, номер телефона, роль и пароль обязательны"
    });
  }
  
  if (![
    "admin",
    "user",
    "senior_spec"
  ].includes(role)) {
    return res.status(400).json({ message: "Неверная роль" });
  }
  
  const is_senior_spec = role === 'senior_spec';
  
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const sql = 'INSERT INTO users (username, full_name, role, password, sip, phone_number, is_senior_spec) VALUES (?, ?, ?, ?, ?, ?, ?)';
    
    db.run(sql, [
      username,
      full_name,
      is_senior_spec ? 'user' : role,
      hashedPassword,
      sip,
      phone_number,
      is_senior_spec ? 1 : 0
    ], function (err) {
      if (err) {
        return res.status(400).json({ message: "Имя пользователя занято" });
      }
      res.status(200).json({ message: "Вы успешно зарегистрированы" });
    });
  } catch (error) {
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

authRouter.post("/sign-in", (req, res) => {
  const {
    username,
    password
  } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "Имя пользователя и пароль обязательны" });
  }
  const sql = `
    SELECT
      u.*,
      CASE WHEN uc.id IS NOT NULL THEN 1 ELSE 0 END as checked_in
    FROM users u
    LEFT JOIN checkins uc ON u.id = uc.user_id AND uc.check_out_time IS NULL
    WHERE u.username = ?
  `;
  
  db.get(sql, [username], async (err, user) => {
    if (err) return res.status(500).json({ message: "Ошибка базы данных" });
    if (!user) return res.status(401).json({ message: "Неверный логин или пароль" });
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(401).json({ message: "Неверный логин или пароль" });
    
    const token = jwt.sign({
      userId: user.id,
      username: user.username
    }, SECRET_KEY, {
      //expiresIn: "1h",
    });
    
    res.json({
      message: "Вы успешно авторизованы",
      data: {
        ...user,
        role: !!user.is_senior_spec ? 'senior_spec' : user.role,
        password: null,
        checked_in: !!user.checked_in,
        token,
      }
    });
  });
});

export default authRouter;
