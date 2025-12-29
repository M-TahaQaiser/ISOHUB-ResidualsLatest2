import express from 'express';
import {
  login,
  signup,
  generateToken
} from '../controllers/auth.controller.js';

const authR = express.Router();

authR.post('/login', login);
authR.post('/signup', signup);
authR.post('/generate-token', generateToken);

export default authR;