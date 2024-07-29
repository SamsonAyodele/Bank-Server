import { Request, Response } from "express";
import utility from "../utils/index.utils";
import { ResponseCode } from "../interfaces/enum/code.enum";
import AccountService from "../services/account-service";
import PayeeService from "../services/payee-service";
import { autoInjectable } from "tsyringe";
import Permissions from "../permission/index";
import LoanService from "../services/loan-service";
import TransactionService from "../services/transaction-service";
import { LoanInterest, LoanMinimumTransactionPercent, LoanStatus } from "../interfaces/enum/loan-enum";
import { ILoan } from "../interfaces/loan-interface";

@autoInjectable()
class AccountController {
  private accountService: AccountService;
  private payeeService: PayeeService;
  private loanService: LoanService;
  private transactionService: TransactionService


  constructor(_accountService: AccountService ,_payeeService: PayeeService, _loanService:LoanService, _transactionService: TransactionService ) {
    this.accountService = _accountService;
    this.payeeService = _payeeService;
    this.loanService = _loanService;
    this.transactionService = _transactionService

  }
  async createAccount(req: Request, res: Response) {
    try {
      const params = {...req.body}
      const newAccount = {
        userId: params.user.id,
        type: params.type
      }
      let account = await this.accountService.createAccount(newAccount)
      return utility.handleSuccess(res, 'Account created successfully',{account},ResponseCode.SUCCESS)
    } catch (error) {
      return utility.handleError(res, (error as TypeError).message, ResponseCode.SERVER_ERROR)
    }
  }

  async getAllUserAccounts(req: Request, res: Response) {
    try {
      const params = { ...req.body };
      let accounts = await this.accountService.getAccountsByUserId(params.user.id);
      return utility.handleSuccess(res, "Account fetched successfully", { accounts }, ResponseCode.SUCCESS);
    } catch (error) {
      return utility.handleError(res, (error as TypeError).message, ResponseCode.SERVER_ERROR);
    }
  }

  async getUserAccount(req: Request, res: Response) {
    try {
      const params = { ...req.params };
      let account = await this.accountService.getAccountByField({ id:utility.escapeHtml(params.id) });
      if (!account) {
        return utility.handleError(res, "Account does not exist", ResponseCode.NOT_FOUND);
      }
      return utility.handleSuccess(res, "Account fetched successfully", { account }, ResponseCode.SUCCESS);
    } catch (error) {
      return utility.handleError(res, (error as TypeError).message, ResponseCode.SERVER_ERROR);
    }
  }

  async getAllUserPayee(req: Request, res: Response) {
    try {
      const params = { ...req.body };
      let payees = await this.payeeService.getPayeesByUserId(params.user.id);
      return utility.handleSuccess(res, "Payees fetched successfully", { payees }, ResponseCode.SUCCESS);
    } catch (error) {
      return utility.handleError(res, (error as TypeError).message, ResponseCode.SERVER_ERROR);
    }
  }

  async getUserPayee(req: Request, res: Response) {
    try {
      const params = { ...req.params };
      let payee = await this.payeeService.getPayeeByField({ id:utility.escapeHtml(params.id) });
      if (!payee) {
        return utility.handleError(res, "Payee does not exist", ResponseCode.NOT_FOUND);
      }
      return utility.handleSuccess(res, "Payee fetched successfully", { payee }, ResponseCode.SUCCESS);
    } catch (error) {
      return utility.handleError(res, (error as TypeError).message, ResponseCode.SERVER_ERROR);
    }
  }

  async getAllUserAccountsByAdmin(req:Request, res:Response){
    try {
      const params = {...req.body}
      const admin = {...req.body.user}
      const permission = Permissions.can(admin.roles).readAny("accounts") 
      if(!permission.granted){
        return utility.handleError(res, 'Permission not granted', ResponseCode.NOT_FOUND)
      }
      let accounts = await this.accountService.getAccounts()
      return utility.handleSuccess(res, "Successfully", { accounts }, ResponseCode.SUCCESS);
    } catch (error) {
      return utility.handleError(res, (error as TypeError).message, ResponseCode.SERVER_ERROR);
    }
  }

  async getUserAccountAdmin(req:Request, res:Response){
    try {
      const params = {...req.params}
      const admin = {...req.body.user}
      const permission = Permissions.can(admin.roles).readAny("accounts") 
      if(!permission.granted){
        return utility.handleError(res, 'Permission not granted', ResponseCode.NOT_FOUND)
      }

      let account = await this.accountService.getAccountByField({id: utility.escapeHtml(params.id)})
      if(!account){
        return utility.handleError(res, 'Account does not exist', ResponseCode.NOT_FOUND)
      }

      return utility.handleSuccess(res, "Successfully", { account }, ResponseCode.SUCCESS);
    } catch (error) {
      return utility.handleError(res, (error as TypeError).message, ResponseCode.SERVER_ERROR);
    }
  }

  async applyLoan(req: Request, res: Response) {
    try {
      const params = { ...req.body };
      let loanExists = await this.loanService.getLoanByField({ accountId: params.accountId, status: LoanStatus.PENDING });
      if (loanExists) {
        return utility.handleError(res, "You already have a loan pending on this account", ResponseCode.NOT_FOUND);
      }

     loanExists = await this.loanService.getLoanByField({ accountId: params.accountId, status: LoanStatus.ACTIVE });
      if (loanExists) {
        return utility.handleError(res, "You already have a loan active on this account", ResponseCode.NOT_FOUND);
      }

      let account = await this.accountService.getAccountByField({ id: params.accountId });
      if (!account) {
        return utility.handleError(res, "Account does not exist", ResponseCode.NOT_FOUND);
      }

      if (account.userId != params.user.id) {
        return utility.handleError(res, "Account does not belong to owner", ResponseCode.NOT_FOUND);
      }

      const totalAmountTransacted = await this.transactionService.getTransactionSum('amount', { userId: params.user.id, accountId: params.accountId });
      const minRequiredTransaction = totalAmountTransacted * LoanMinimumTransactionPercent;
      if (minRequiredTransaction > params.amount) {
        return utility.handleError(res, "You are not eligible for this loan", ResponseCode.NOT_FOUND);
      }
      const newLoan = {
        userId: params.user.id,
        accountId: params.accountId,
        amount: params.amount,
        interest: LoanInterest
      } as Partial<ILoan>;

      let loan = await this.loanService.createLoan(newLoan);
      return utility.handleSuccess(res, "Loan created successfully", { loan }, ResponseCode.SUCCESS);
    } catch (error) {
      return utility.handleError(res, (error as TypeError).message, ResponseCode.SERVER_ERROR);
    }
  }

  async getAllUserLoan(req: Request, res: Response) {
    try {
      const params = { ...req.body }
      let loans = await this.loanService.getLoansByUserId(params.user.id);
      return utility.handleSuccess(res, "Loans fetched successfully", { loans }, ResponseCode.SUCCESS);
    } catch (error) {
      return utility.handleError(res, (error as TypeError).message, ResponseCode.SERVER_ERROR);
    }
  }

  async getLoansAdmin(req: Request, res: Response) {
    try {
      const params = { ...req.params };
      const admin = { ...req.body.user }
      const permission = Permissions.can(admin.role).readAny('loans');
      if (!permission.granted) {
        return utility.handleError(res, 'Invalid Permission', ResponseCode.NOT_FOUND);
      }
      let loans = await this.loanService.getLoans();
      return utility.handleSuccess(res, "Loans fetched successfully", { loans }, ResponseCode.SUCCESS);
    } catch (error) {
      return utility.handleError(res, (error as TypeError).message, ResponseCode.SERVER_ERROR);
    }
  }


  async approveOrDeclineLoanByAdmin(req: Request, res: Response) {
    try {
      const params = { ...req.body }
      const admin = { ...req.body.user }
      const permission = Permissions.can(admin.role).updateAny('loans');
      if (!permission.granted) {
        return utility.handleError(res, 'Invalid Permission', ResponseCode.NOT_FOUND);
      }

      let loan = await this.loanService.getLoanByField({ id: params.loanId });
      if (!loan) {
        return utility.handleError(res, 'Invalid loan Record', ResponseCode.NOT_FOUND);
      }

      if (loan.status != LoanStatus.PENDING) {
        return utility.handleError(res, 'Loan has already been processed', ResponseCode.NOT_FOUND);
      }

      await this.loanService.updateRecord({ id: loan.id }, { status: params.status });
      if (params.status == LoanStatus.ACTIVE) {
        await this.accountService.topUpBalance(loan.accountId, loan.amount);
      }
      return utility.handleSuccess(res, "Loan status updated successful ", {}, ResponseCode.SUCCESS);

    } catch (error) {
      return utility.handleError(res, (error as TypeError).message, ResponseCode.SERVER_ERROR);
    }
  }

}

export default AccountController;
