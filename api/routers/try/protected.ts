import { StatusCodes } from "http-status-codes";
import { endpoints } from "../../utils/express";
import { TryRouter } from "../try";

TryRouter.get(endpoints.try.unprotected, (req, res, next) => {
  res.json({
    data: {
      resource: "unprotected",
      access: true,
    },
  });
});

TryRouter.get(endpoints.try.protected, (req, res, next) => {
  res.status(StatusCodes.NOT_IMPLEMENTED).json({
    data: {
      resource: "protected",
      access: "SESSION ID",
    },
  });
});
