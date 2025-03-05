import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 8000;
const corsOptions = {
  origin: "*",
};

app.use(cors(corsOptions));
app.use(express.json());

app.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`);
});
