import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import startPort from './controllers/port.js';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.send('Backend MERN Quantum up!'));

startPort(app, 5000);