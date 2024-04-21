import express, { Request, Response } from "express";
import { validator, Auth } from "../middlewares/index.middleware";
import ValidationSchema from "../validators/transaction-validator-schema";
import TransactionService from "../services/transaction-service";
import TransactionDataSource from "../datasources/transaction-datasource";
import TransactionController from "../controllers/transaction-controller";
import AccountDataSource from "../datasources/account-datasource";
import AccountService from "../services/account-service";


const router = express.Router();
const transactionService = new TransactionService(new TransactionDataSource());
const accountService = new AccountService(new AccountDataSource());
//Instance of the TransactionController
const transactionController = new TransactionController(transactionService, accountService);

const createTransactionRoute = () => {

  router.post("/initiate-Paystack-Deposit", validator(ValidationSchema.initiatePaystackDeposit), Auth(), (req: Request, res: Response) => {
    return transactionController.initiatePaystackDeposit(req, res);
  });

  router.post("/verify-Paystack-Deposit", validator(ValidationSchema.verifyPaystackDeposit), Auth(), (req: Request, res: Response) => {
    return transactionController.verifyPaystackDeposit(req, res);
  });

  return router;
};

export default createTransactionRoute();
