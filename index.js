import express from 'express';
import cors from 'cors';
import actionsTreeRouter from "./routers/actionsTree.js";
import usersRouter from "./routers/user.js";
import authRouter from "./routers/auth.js";
import cardsRouter from "./routers/cards.js";
import hydraSeekerRouter from "./routers/hydraSeeker.js";
import dotenv from 'dotenv';
import auth from "./middleware/auth.js";

dotenv.config();

const app = express();
const PORT = 8010;
const corsOptions = {
  origin: "*",
};

app.use(cors(corsOptions));
app.use(express.json());
app.use('/', authRouter);
app.use('/users', auth, usersRouter);
app.use('/actions_tree', auth, actionsTreeRouter);
app.use('/cards', auth, cardsRouter);
app.use('/hydra_seeker', auth, hydraSeekerRouter);

app.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`);
});
