import express from 'express';
import cors from 'cors';
import actionsTreeRouter from "./routers/actionsTree.js";
import usersRouter from "./routers/user.js";
import authRouter from "./routers/auth.js";

const app = express();
const PORT = 8000;
const corsOptions = {
  origin: "*",
};

app.use(cors(corsOptions));
app.use(express.json());
app.use('/', authRouter);
app.use('/users', usersRouter);
app.use('/actions_tree', actionsTreeRouter);

app.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`);
});
