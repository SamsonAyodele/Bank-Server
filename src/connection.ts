import { Sequelize } from "sequelize";
require("dotenv").config();

const database = process.env.DB_NAME as string;
const username = process.env.DB_USER as string;
const password = process.env.DB_PW as string;


const sequelize = new Sequelize(database, username, password, {
  host: "localhost",
  dialect: "mysql",
});

export default sequelize;
