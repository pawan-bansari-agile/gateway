import { Observable } from 'rxjs';

export interface IGrpcService {
  CreateBook(data: IBook): Observable<any>;
  CreateUser(data: IUser): Observable<any>;
  GetBooks(data: { userId: string }): Observable<any>;
  GetUsers(data: Record<string, never>): Observable<any>;
  GetUser(data: { id: string }): Observable<any>;
  GetBook(data: { id: string; userId: string }): Observable<any>;
  UpdateUser(data: IUpdateUser): Observable<any>;
  UpdateBook(data: IUpdateBook): Observable<any>;
  DeleteUser(data: DeleteUserRequest): Observable<any>;
  DeleteBook(data: DeleteBookRequest): Observable<any>;
  Login(data: ILogin): Observable<any>;
}

interface IUser {
  email: string;
  userName: string;
  password: string;
}

interface IUpdateUser {
  id: string;
  email?: string;
  userName?: string;
  password?: string;
}

interface IUpdateBook {
  id: string;
  title?: string;
  author?: string;
  description?: string;
  userId?: string;
}

interface IBook {
  title: string;
  description: string;
  author: string;
  userId?: string;
}

interface ILogin {
  email: string;
  password: string;
}

export interface DeleteUserRequest {
  id: string;
}

export interface DeleteBookRequest {
  id: string;
  userId: string;
}
