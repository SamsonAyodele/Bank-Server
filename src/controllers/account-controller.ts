import { Request, Response } from "express";
import utility from "../utils/index.utils";
import { ResponseCode } from "../interfaces/enum/code.enum";
import AccountService from "../services/account-service";
import PayeeService from "../services/payee-service";
import { autoInjectable } from "tsyringe";

@autoInjectable()
class AccountController {
  private accountService: AccountService;
  private payeeService: PayeeService;


  constructor(_accountService: AccountService ,_payeeService: PayeeService ) {
    this.accountService = _accountService;
    this.payeeService = _payeeService;

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
}

export default AccountController;
