import db from "../db.js";
import jwt from "jsonwebtoken";

const SECRET_KEY = process.env.SECRET_KEY;

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "У вас нет доступа" });
    }
    
    const token = authHeader.split(" ")[1];
    
    jwt.verify(token, SECRET_KEY, (err, decoded) => {
      if (err) {
        console.error("Ошибка JWT:", err);
        return res.status(403).json({ error: "Неверный токен" });
      }
      
      const userId = decoded.userId;
      
      const sql = "SELECT * FROM users WHERE id = ?";
      db.get(sql, [userId], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: "Пользователь не найден" });
        
        req.user = row;
        
        next();
      });
    });
  } catch (e) {
    res.status(500).json({ error: "Ошибка сервера" });
  }
};

export default auth;
