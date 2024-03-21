import bcrypt from "bcrypt";
import { AccountStatus, EmailStatus, UserRoles } from "../interfaces/enum/user-enum";
import { IUserCreationBody } from "../interfaces/user-interface";
import UserService from "../services/user-service";
import { Request, Response } from "express";
import utility from "../utils/index.utils";
import { ResponseCode } from "../interfaces/enum/code.enum";

class UserController {
  private userService: UserService;

  constructor(_userService: UserService) {
    this.userService = _userService;
  }
  async register(req: Request, res: Response) {
    try {
      //Structuring user data
      const params = { ...req.body };
      const newUser = {
        firstName: params.firstName,
        lastName: params.lastName,
        email: params.email,
        username: params.email.split("@")[0],
        password: params.password,
        role: UserRoles.CUSTOMER,
        isEmailVerified: EmailStatus.NOT_VERIFIED,
        accountStatus: AccountStatus.ACTIVE,
      } as IUserCreationBody;

      //Hashing the password
      newUser.password = bcrypt.hashSync(newUser.password, 10);

      //Check if user exist
      const userExist = await this.userService.getUserByField({ email: newUser.email });
      if (userExist) {
        return utility.handleError(res, "Email already exist", ResponseCode.ALREADY_EXIST);
      }
      //Create user
      let user = await this.userService.createUser(newUser);
      user.password = "";
      return utility.handleSuccess(res, "User created successfully", { user }, ResponseCode.SUCCESS);
    } catch (error) {
      res.send({ message: "Server error" });
    }
  }

  async login(req: Request, res: Response) {
    try {
      res.send({ message: "Login successful" });
    } catch (error) {
      res.send({ message: "Server error" });
    }
  }

  async forgotPassword(req: Request, res: Response) {
    try {
      res.send({ message: "Forgot password mail sent" });
    } catch (error) {
      res.send({ message: "Server error" });
    }
  }

  async resetPassword(req: Request, res: Response) {
    try {
      res.send({ message: "Password rest successful" });
    } catch (error) {
      res.send({ message: "Server error" });
    }
  }
}

export default UserController;
