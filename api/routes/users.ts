import { Router } from 'express';

export const UsersRouter = Router();

/** GET users listing. */
UsersRouter.get('/', function(req, res, next) {
  res.send('respond with a resource');
});
