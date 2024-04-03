import express, { Request, Response } from "express";
import AccountController from "../controllers/account-controller";
import AccountService from "../services/account-service";
import { validator, Auth } from "../middlewares/index.middleware";
import ValidationSchema from "../validators/account-validator-schema";
import AccountDataSource from "../datasources/account-datasource";


const router = express.Router();
const accountService = new AccountService(new AccountDataSource());
//Instance of the AccountController
const accountController = new AccountController(accountService);

const createAccountRoute = () => {

  router.post("/create-account", validator(ValidationSchema.createAccountSchema), Auth(), (req: Request, res: Response) => {
    return accountController.createAccount(req, res);
  });

  return router;
};

export default createAccountRoute();
