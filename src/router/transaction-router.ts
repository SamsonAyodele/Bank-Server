import express, { Request, Response } from "express";
import { validator, Auth } from "../middlewares/index.middleware";
import ValidationSchema from "../validators/transaction-validator-schema";
import TransactionService from "../services/transaction-service";
import TransactionDataSource from "../datasources/transaction-datasource";
import TransactionController from "../controllers/transaction-controller";
import AccountDataSource from "../datasources/account-datasource";
import AccountService from "../services/account-service";
import PayeeDataSource from "../datasources/payee-datasource";
import PayeeService from "../services/payee-service";


const router = express.Router();
const transactionService = new TransactionService(new TransactionDataSource());
const accountService = new AccountService(new AccountDataSource());
const payeeService = new PayeeService(new PayeeDataSource())
//Instance of the TransactionController
const transactionController = new TransactionController(transactionService, accountService, payeeService);

const createTransactionRoute = () => {

  router.post("/initiate-Paystack-Deposit", validator(ValidationSchema.initiatePaystackDeposit), Auth(), (req: Request, res: Response) => {
    return transactionController.initiatePaystackDeposit(req, res);
  });

  router.post("/verify-Paystack-Deposit", validator(ValidationSchema.verifyPaystackDeposit), Auth(), (req: Request, res: Response) => {
    return transactionController.verifyPaystackDeposit(req, res);
  });

  router.post("/make-transfer", validator(ValidationSchema.makeInternalTransfer), Auth(), (req: Request, res: Response) => {
    return transactionController.internalTransfer(req, res);
  });

  router.post("/make-withdrawal-by-paystack", validator(ValidationSchema.makeWithdrawalByPaystack), Auth(), (req: Request, res: Response) => {
    return transactionController.withdrawByPaystack(req, res);
  });

  router.get("/list", Auth(), (req: Request, res: Response) => {
    return transactionController.getAllUserTransactions(req, res);
  });

  router.get("/:id", Auth(), (req: Request, res: Response) => {
    return transactionController.getUserTransaction(req, res);
  });

  return router;
};

export default createTransactionRoute();
