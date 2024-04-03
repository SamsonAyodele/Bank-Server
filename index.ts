import express, { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import cors from "cors";
// import sequelize from "./src/connection";
import dbInit from "./src/database/init"
import UserRouter from "./src/router/user.router";
import AccountRouter from "./src/router/account.router";
const port = process.env.PORT;

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

// app.listen(port, async () => {
//   console.log(`[server]: Server is running on port ${port}`);
//   try {
//     // sync all models
//     await sequelize.sync({ alter: true });
//     console.log("All models synchronized successfully.");
//     await sequelize.authenticate();
//     console.log("Connection has been established successfully.");
//   } catch (error) {
//     console.error("Unable to connect to the database:", error);
//   }
// });
