import { Sequelize, Dialect } from "sequelize";
require("dotenv").config();

const database = process.env.DB_NAME as string;
const username = process.env.DB_USERNAME as string;
const password = process.env.DB_PASSWORD as string;
const host = process.env.DB_HOST as string;
const dialect = (process.env.DB_DIALECT as Dialect) ?? 'mysql';


const sequelize = new Sequelize(database, username, password, {
  host,
  dialect,
});

export default sequelize;


