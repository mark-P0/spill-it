import { Router } from "express";
import { StatusCodes } from "http-status-codes";
import { endpoints } from "../utils/express";

export const UsersRouter = Router();

UsersRouter.get(endpoints.api.v0.users.me, (req, res, next) => {
  if (req.user === undefined) {
    res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ redirect: endpoints.api.v0.login["/"] });
    return;
  }

  res.json({ data: req.user });
});
