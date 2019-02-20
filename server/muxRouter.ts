import express from 'express';
import expressWs from 'express-ws';

export const muxRouter = express.Router();

muxRouter.ws('/echo', ws => {});
