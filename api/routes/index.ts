import { Router } from 'express';

export const IndexRouter = Router();

/** GET home page. */
IndexRouter.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});
