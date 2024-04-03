import bcrypt from "bcrypt";
import JWT from "jsonwebtoken";
import { AccountStatus, EmailStatus, UserRoles } from "../interfaces/enum/user-enum";
import { IUserCreationBody } from "../interfaces/user-interface";
import UserService from "../services/user-service";
import { Request, Response } from "express";
import utility from "../utils/index.utils";
import { ResponseCode } from "../interfaces/enum/code.enum";
import TokenService from "../services/token-service";
import { IToken } from "../interfaces/token-interface";
import EmailService from "../services/email-service";
import moment from "moment";
import AccountService from "../services/account-service";

class AccountController {
  private accountService: AccountService;

  constructor(_accountService: AccountService) {
    this.accountService = _accountService;
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
}

export default AccountController;
