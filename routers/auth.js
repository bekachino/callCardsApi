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
    name,
    role = 'user',
    password,
    sip,
    phone_number
  } = req.body;
  
  if (!username || !name || !password || !sip || !phone_number) {
    return res.status(400).json({
      error: "Имя пользователя, ФИО, СИП, номер телефона, роль и пароль обязательны"
    });
  }
  
  if (![
    "admin",
    "user"
  ].includes(role)) {
    return res.status(400).json({ error: "Неверная роль" });
  }
  
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const sql = 'INSERT INTO users (username, name, role, password, sip, phone_number) VALUES (?, ?, ?, ?, ?, ?)';
    
    db.run(sql, [
      username,
      name,
      role,
      hashedPassword,
      sip,
      phone_number
    ], function (err) {
      if (err) {
        return res.status(400).json({ error: "Имя пользователя занято" });
      }
      res.status(201).json({ message: "Вы успешно зарегистрированы" });
    });
  } catch (error) {
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

authRouter.post("/sign-in", (req, res) => {
  const {
    username,
    password
  } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Имя пользователя и пароль обязательны" });
  }
  const sql = 'SELECT * FROM users WHERE username = ?';
  
  db.get(sql, [username], async (err, user) => {
    if (err) return res.status(500).json({ error: "Ошибка базы данных" });
    if (!user) return res.status(401).json({ error: "Неверный логин или пароль" });
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(401).json({ error: "Неверный логин или пароль" });
    
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
        token,
      }
    });
  });
});

export default authRouter;
