import express from 'express';
import cors from 'cors';
import actionsTreeRouter from "./routers/actionsTree.js";

const app = express();
const PORT = 8000;
const corsOptions = {
  origin: "*",
};

app.use(cors(corsOptions));
app.use(express.json());
app.use('/actions_tree', actionsTreeRouter);

app.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`);
});
