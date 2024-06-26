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
import { autoInjectable } from "tsyringe";
import Permissions from "../permission/index"

@autoInjectable()
class UserController {
  private userService: UserService;
  private tokenService: TokenService;


  constructor(_userService: UserService, _tokenService: TokenService) {
    this.userService = _userService;
    this.tokenService = _tokenService
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
      console.log(user)
      user.password = "";
      return utility.handleSuccess(res, "User created successfully", { user }, ResponseCode.SUCCESS);
    } catch (error) {
      return utility.handleError(res, (error as TypeError).message, ResponseCode.SERVER_ERROR);
    }
  }

  async login(req: Request, res: Response) {
    try {
      const params = { ...req.body };
      //Check if user email exist
      let user = await this.userService.getUserByField({ email: params.email });
      if (!user) {
        return utility.handleError(res, "Invalid login details", ResponseCode.NOT_FOUND);
      }
      //Check if password is valid
      let isValidPassword = await bcrypt.compare(params.password, user.password);
      if (!isValidPassword) {
        return utility.handleError(res, "Invalid login details", ResponseCode.NOT_FOUND);
      }

      const token = JWT.sign(
        {
          firstName: user.firstName,
          lastName: user.lastName,
          id: user.id,
          role: user.role,
        },
        process.env.JWT_KEY as string,
        { expiresIn: "5h" }
      );
      return utility.handleSuccess(res, "Login successful", {user, token}, ResponseCode.SUCCESS);
    } catch (error) {
      return utility.handleError(res, (error as TypeError).message, ResponseCode.SERVER_ERROR);
    }
  }

  async forgotPassword(req: Request, res: Response) {
    try {
      const params = { ...req.body };
      //Check if user email exist
      let user = await this.userService.getUserByField({ email: params.email });
      if (!user) {
        return utility.handleError(res, "Account does not exist", ResponseCode.NOT_FOUND);
      }

      const token = (await this.tokenService.createForgotPasswordToken(params.email)) as IToken
      await EmailService.sendForgotPasswordMail(params.email, token.code)
      return utility.handleSuccess(res, "Password reset code has been sent to your mail", {}, ResponseCode.SUCCESS);
  
    } catch (error) {
      return utility.handleError(res, (error as TypeError).message, ResponseCode.SERVER_ERROR);
    }
  }

  async resetPassword(req: Request, res: Response) {
    try {
      const params = { ...req.body };
      let isValidToken = await this.tokenService.getTokenByField({key: params.email, code: params.code, 
        type: this.tokenService.TokenTypes.FORGOT_PASSWORD, status: this.tokenService.TokenStatus.NOT_USED })

      if(!isValidToken){
        return utility.handleError(res, "Token has expired", ResponseCode.NOT_FOUND);
      }

      if(isValidToken && moment(isValidToken.expires).diff(moment(), 'minutes') <= 0){
        return utility.handleError(res, "Token has expired", ResponseCode.NOT_FOUND);
      }

      let user = await this.userService.getUserByField({email: params.email})
      if(!user){
        return utility.handleError(res, "Invalid user record", ResponseCode.NOT_FOUND);
      }

      const _password = bcrypt.hashSync(params.password, 10)

      await this.userService.updateRecord({id: user.id}, {password:_password })
      await this.tokenService.updateRecord({id: isValidToken.id}, {status: this.tokenService.TokenStatus.USED})

        return utility.handleSuccess(res, "Password reset successful", {user}, ResponseCode.SUCCESS);
    } catch (error) {
      return utility.handleError(res, (error as TypeError).message, ResponseCode.SERVER_ERROR);
    }
  }

  async getAllUsersByAdmin(req:Request, res:Response){
try {
  const admin = {...req.body.user}
  const permission = Permissions.can(admin.roles).readAny("users") 
  if(!permission.granted){
    return utility.handleError(res, 'Permission not granted', ResponseCode.NOT_FOUND)
  }

  let users = (await this.userService.getAllUsers())
  if(users && users.length > 0){
    users = users.map((item)=>{
      item.password = ''
      return item
    })
  }
  return utility.handleSuccess(res, 'User fetched successfully',{users}, ResponseCode.SUCCESS)
} catch (error) {
  return utility.handleError(res, (error as TypeError).message, ResponseCode.SERVER_ERROR);
}
  }

  async getSingleUserById(req:Request, res:Response){
    try {
      const params = {...req.params}
      const admin = {...req.body.user}
      const permission = Permissions.can(admin.roles).readAny("users") 
      if(!permission.granted){
        return utility.handleError(res, 'Permission not granted', ResponseCode.NOT_FOUND)
      }

      let user = await this.userService.getUserByField({id: utility.escapeHtml(params.id)})
      if(!user){
        return utility.handleError(res, 'User does not exist', ResponseCode.NOT_FOUND)
      }
      user.password = ''
      return utility.handleSuccess(res, 'User fetched successfully',{user}, ResponseCode.SUCCESS)
    } catch (error) {
      return utility.handleError(res, (error as TypeError).message, ResponseCode.SERVER_ERROR);
    }
  }

  async setAccountStatus(req:Request, res:Response){
    try {
      const params = {...req.params}
      const admin = {...req.body.user}
      const permission = Permissions.can(admin.roles).readAny("users") 
      if(!permission.granted){
        return utility.handleError(res, 'Permission not granted', ResponseCode.NOT_FOUND)
      }

      let user = await this.userService.getUserByField({id: params.userId})
      if(!user){
        return utility.handleError(res, 'Invalid user record', ResponseCode.NOT_FOUND)
      }
      await this.userService.updateRecord({id: user.id}, ({accountStatus:params.status}))
      return utility.handleSuccess(res, 'Account status updated successfully',{user}, ResponseCode.SUCCESS)
    } catch (error) {
      return utility.handleError(res, (error as TypeError).message, ResponseCode.SERVER_ERROR);
    }
  }

  async getProfile(req:Request, res:Response){
    try {
      const params = {...req.body}
      let user = await this.userService.getUserByField({id: params.user.id})
      if(!user){
        return utility.handleError(res, 'User does not exist', ResponseCode.NOT_FOUND)
      }
      user.password= ''
      return utility.handleSuccess(res, 'User fetched successfully',{user}, ResponseCode.SUCCESS)
    } catch (error) {
      return utility.handleError(res, (error as TypeError).message, ResponseCode.SERVER_ERROR);
    }
  }

}

export default UserController;
