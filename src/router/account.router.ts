import express, { Request, Response } from "express";
import AccountController from "../controllers/account-controller";
import { validator, Auth } from "../middlewares/index.middleware";
import ValidationSchema from "../validators/account-validator-schema";
import { container } from "tsyringe";


const router = express.Router();

//Instance of the AccountController
const accountController = container.resolve(AccountController)

const createAccountRoute = () => {

  router.post("/create-account", validator(ValidationSchema.createAccountSchema), Auth(), (req: Request, res: Response) => {
    return accountController.createAccount(req, res);
  });

  router.get('/account-list', Auth(), (req: Request, res: Response) => {
    return accountController.getAllUserAccounts(req, res);
  });
 

  router.get('/:id', Auth(), (req: Request, res: Response) => {
    return accountController.getUserAccount(req, res);
  });

  router.get("/payee/list", Auth(), (req: Request, res: Response) => {
    return accountController.getAllUserPayee(req, res);
  });


  router.get("/payee/:id", Auth(), (req: Request, res: Response) => {
    return accountController.getUserPayee(req, res);
  });

  return router;
};

export default createAccountRoute();
