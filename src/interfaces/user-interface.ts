import {Optional, Model} from "sequelize"


export interface IUser {
    id: string,
    username: string,
    password: string,
    firstName: string,
    lastName: string,
    email: string,
    role: string,
    isEmailVerified: string,
    accountStatus: string,
    createdAt: Date,
    updatedAt: Date
}

export interface IUserCreationBody extends Optional<IUser, 'id' | 'updatedAt' | 'createdAt'>{}

export interface IUserModel extends Model<IUser, IUserCreationBody>, IUser{}