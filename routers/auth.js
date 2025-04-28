import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../db.js";
import * as dotenv from "dotenv";

dotenv.config();

const authRouter = express.Router();
const SECRET_KEY = process.env.SECRET_KEY;

authRouter.post("/sign-up", async (req, res) => {
  const {
    username,
    full_name,
    role = 'user',
    password,
    sip,
    phone_number
  } = req.body;
  
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
  const sql = 'SELECT * FROM users WHERE username = ?';
  
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
        password: null,
        token,
      }
    });
  });
});

authRouter.post("/reset_password", async (req, res) => {
  const {
    id,
    new_password
  } = req.body;
  
  if (!id || !new_password) {
    return res.status(400).json({
      message: "ID и новый пароль обязательны"
    });
  }
  
  try {
    const hashedPassword = await bcrypt.hash(new_password, 10);
    
    const sql = `UPDATE users SET password = ? WHERE id = ?`;
    
    db.run(sql, [
      hashedPassword,
      id
    ], function (err) {
      if (err) {
        return res.status(500).json({ message: "Ошибка сервера" });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ message: "Пользователь не найден" });
      }
      
      res.status(200).json({ message: "Пароль успешно сброшен" });
    });
  } catch (error) {
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

export default authRouter;
