import express, { Request, Response } from "express";
import UserController from "../controllers/user-controller";
import UserService from "../services/user-service";
import { validator } from "../middlewares/index.middleware";
import ValidationSchema from "../validators/user-validator-schema";
import UserDataSource from "../datasources/user-datasource";

const createUserRoute = () => {
  const router = express.Router();
  const userService = new UserService(new UserDataSource());
  //Instance of the UserController
  const userController = new UserController(userService);

  router.post("/register", validator(ValidationSchema.registerSchema), (req: Request, res: Response) => {
    return userController.register(req, res);
  });

  router.post("/login", validator(ValidationSchema.loginSchema), (req: Request, res: Response) => {
    return userController.login(req, res);
  });

  router.post("/forgot-Password", validator(ValidationSchema.forgotPasswordSchema), (req: Request, res: Response) => {
    return userController.forgotPassword(req, res);
  });

  router.post("/reset-password", (req: Request, res: Response) => {
    return userController.resetPassword(req, res);
  });
  return router;
};

export default createUserRoute();
