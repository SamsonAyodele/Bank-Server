import express, { Express, Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import cors from "cors";
import sequelize from "./connection";
// import createUserRoute from "./router/user.router";
import UserRouter from "./router/user.router";


dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;


app.use(express.json);
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

app.use("/api/user", UserRouter)

app.get("/", (req: Request, res: Response) => {
  res.send("Welcome to My bank app");
});

app.listen(port, async () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
  try {
    // sync all models
    await sequelize.sync({ alter: true });
    console.log("All models synchronized successfully.");
    await sequelize.authenticate();
    console.log("Connection has been established successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
});
