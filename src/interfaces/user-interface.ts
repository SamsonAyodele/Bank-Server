import { Optional, Model } from "sequelize";

export interface IUser {
  id: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isEmailVerified: string;
  accountStatus: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFindUserQuery {
  where: {
    [key: string]: string;
  };
  raw?: boolean;
  returning: boolean;
}

export interface IUserCreationBody extends Optional<IUser, "id" | "updatedAt" | "createdAt"> {}

export interface IUserModel extends Model<IUser, IUserCreationBody>, IUser {}

export interface IUserDataSource {
  fetchOne(query: IFindUserQuery): Promise<IUser | null>;
  create(record: IUserCreationBody): Promise<IUser>;
  updateOne(searchBy: IFindUserQuery, data: Partial<IUser>): Promise<void>
}
