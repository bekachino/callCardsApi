import express from 'express';
import cors from 'cors';
import actionsTreeRouter from "./routers/actionsTree.js";
import usersRouter from "./routers/user.js";
import authRouter from "./routers/auth.js";
import cardsRouter from "./routers/cards.js";
import hydraSeekerRouter from "./routers/hydraSeeker.js";
import pg from 'pg';
import auth from "./middleware/auth.js";

const app = express();
const PORT = 8010;
const corsOptions = {
  origin: "*",
};

const planup = new pg.Pool({
  user: "postgres",
  host: "185.39.79.71",
  database: "planup",
  password: "UmgwTsBkjdTtPBespuqjTGydiEgIAPfr",
  port: 5432,
});

app.use(cors(corsOptions));
app.use(express.json());
app.use('/', authRouter);
app.use('/users', auth, usersRouter);
app.use('/actions_tree', auth, actionsTreeRouter);
app.use('/cards', auth, cardsRouter);
app.use('/hydra_seeker', auth, hydraSeekerRouter);

//app.get('/planup', async (req, res) => {
//  try {
//    const result = await planup.query(`
//      SELECT id, ls_abon, address, ip_address, tariff, balance, state, created_at, name_abon, type_abon, teg, phone_abon, last_pay, user_list, "comment", status, created_at_noactive, regions, squares_id
//      FROM public.dashboard_active_noactive where created_at >= '2025-03-12' and created_at < '2025-03-31' and ls_abon like '%175004930%' and state = 'Неактив';
//    `);
//    res.json(result.rows);
//  } catch (e) {
//    console.log(e);
//  }
//});

app.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`);
});

//planup.connect()
//.then(() => console.log("Connected to PostgreSQL"))
//.catch((err) => console.error("Connection error", err));
