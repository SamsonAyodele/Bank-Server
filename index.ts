import "reflect-metadata"
import express, { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import cors from "cors";
import dbInit from "./src/database/init"
import UserRouter from "./src/router/user.router";
import AccountRouter from "./src/router/account.router";
import TransactionRouter from "./src/router/transaction-router"
import AdminRouter from "./src/router/admin-router";
const port = process.env.DB_PORT;

dotenv.config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: "*",
  })
);

//General error handler
app.use((err: TypeError, req: Request, res: Response, next: NextFunction) => {
  try {
    if (err) {
      return res.status(500).json({ status: false, message: (err as TypeError).message });
    }
  } catch (e) {}
});

app.use("/api/user", UserRouter);
app.use("/api/account", AccountRouter);
app.use("/api/transaction", TransactionRouter);
app.use("/api/admin", AdminRouter)

app.get("/", (req: Request, res: Response) => {
  res.send(`Welcome to My ${process.env.APP_NAME}`);
});

const Bootstrap = async () => {
  try {
    app.listen(port, () => {
      console.log(`server listening on port ${port}`)
    })
    await dbInit()
  } catch (error) { console.error("Unable to connect to the database:", error);}
};

Bootstrap()

