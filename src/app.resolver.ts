import { Logger, OnModuleInit, UseGuards } from '@nestjs/common';
import { Resolver, Query, Args, Mutation } from '@nestjs/graphql';
import { Client, ClientGrpc, Transport } from '@nestjs/microservices';
import { microserviceOptions } from './grpcInterfaces/grpc.options';
import { join } from 'path';
import {
  DeleteBookRequest,
  DeleteUserRequest,
  IGrpcService,
} from './grpcInterfaces/grpc.interface';
import {
  CreateBookInput,
  CreateUserInput,
  UpdateBookInput,
  UpdateUserInput,
} from './graph-schema/graphql';
import { BookType, UserType } from './grpcInterfaces/graphql.objects';
import { lastValueFrom } from 'rxjs';
import { AppService } from './app.service';
import { GraphqlAuthGuard } from './filters/graphql-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@Resolver()
export class AppResolver implements OnModuleInit {
  constructor(private appService: AppService) {}
  private logger = new Logger('AppResolver');

  @Client(microserviceOptions)
  private client: ClientGrpc;

  @Client({
    transport: Transport.GRPC,
    options: {
      url: 'localhost:50052',
      package: 'app',
      protoPath: join(__dirname, '../src/app.proto'),
    },
  })
  private userClient: ClientGrpc;

  private grpcService: IGrpcService;
  private userService: IGrpcService;

  onModuleInit() {
    this.grpcService = this.client.getService<IGrpcService>('BookController');
    this.userService =
      this.userClient.getService<IGrpcService>('UserController');
  }

  // Resolver for creating a Book
  @UseGuards(GraphqlAuthGuard)
  @Mutation(() => BookType)
  async createBook(
    @CurrentUser() user: any,
    @Args('data') data: CreateBookInput,
  ) {
    data.userId = user.userId;
    this.logger.log('Creating Book: ', data);
    return this.grpcService.CreateBook(data);
  }

  @UseGuards(GraphqlAuthGuard)
  @Query(() => [BookType])
  async getBooks(@CurrentUser() user: any) {
    console.log('✌️user from the gateway --->', user);
    const { userId } = user;
    console.log('✌️userId --->', userId);
    this.logger.log('Fetching all Books');
    try {
      // Await the promise directly
      const response = await lastValueFrom(
        this.grpcService.GetBooks({ userId }),
      );
      return response.books;
    } catch (error) {
      this.logger.error('Error fetching todos', error);
      throw new Error('Failed to fetch todos');
    }
  }

  @UseGuards(GraphqlAuthGuard)
  @Query(() => BookType)
  async getBook(@CurrentUser() user: any, @Args('id') id: string) {
    console.log('✌️user --->', user);
    try {
      const { userId } = user;
      console.log('Fetching Book with ID: ', id);

      const data = { id: id, userId: userId };
      console.log('✌️data from resolver --->', data);
      // Fetch the book by ID
      const response = await lastValueFrom(this.grpcService.GetBook(data));

      console.log('✌️response from get book by id --->', response);

      if (response && response.book) {
        return response.book;
      } else {
        throw new Error('Book fetching failed or returned empty response');
      }
    } catch (err) {
      console.error('Error from catch block of get book by id API', err);
      throw new Error(err.message || 'Unknown error occurred');
    }
  }

  @UseGuards(GraphqlAuthGuard)
  @Mutation(() => BookType)
  async updateBook(
    @CurrentUser() user: any,
    @Args('data') data: UpdateBookInput,
  ) {
    this.logger.log('Updating Book: ', data);
    data.userId = user.userId;
    const response = await lastValueFrom(this.grpcService.UpdateBook(data));
    console.log('✌️response --->', response);
    return response.book;
  }

  @UseGuards(GraphqlAuthGuard)
  @Mutation(() => Boolean)
  async deleteBook(
    @CurrentUser() user: any,
    @Args('data') data: DeleteBookRequest,
  ) {
    this.logger.log('Deleting Book with ID: ', data);
    data.userId = user.userId;
    const response = await lastValueFrom(this.grpcService.DeleteBook(data));
    console.log('✌️response --->', response);
    console.log('✌️response --->', response.success);

    // Ensure you're returning the success field from gRPC response
    return response.success;
  }

  @Mutation(() => UserType)
  async createUser(@Args('data') data: CreateUserInput) {
    this.logger.log('Creating User: ', data);
    try {
      const response = await lastValueFrom(this.userService.CreateUser(data));
      console.log('User created:', response);
      // Check if response and response.user are not null
      if (response && response.user) {
        return response.user;
      } else {
        throw new Error('User creation failed or returned empty response');
      }
    } catch (error) {
      this.logger.error('Error creating user', error);
      throw new Error(error);
    }
  }

  // Resolver for retrieving a User by ID
  @Query(() => UserType)
  async getUser(@Args('id') id: string) {
    try {
      this.logger.log('Fetching User with ID: ', id);
      const response = await lastValueFrom(this.userService.GetUser({ id }));
      console.log('✌️response from get user by id --->', response);
      if (response && response.user) {
        return response.user;
      } else {
        throw new Error('User fetching failed or returned empty response');
      }
    } catch (err) {
      this.logger.log('error from catch block of get user by id api', err);
      throw new Error(err);
    }
  }

  // Resolver for retrieving all Users
  @Query(() => [UserType])
  async getUsers() {
    try {
      this.logger.log('Fetching all Users');
      const response = await lastValueFrom(this.userService.GetUsers({}));
      console.log('✌️response --->', response);
      return response.users;
    } catch (err) {
      this.logger.log('error from get all users', err);
      throw new Error(err);
    }
  }

  // Resolver for updating a User
  @Mutation(() => UserType)
  async updateUser(@Args('data') data: UpdateUserInput) {
    this.logger.log('Updating User: ', data);
    const response = await lastValueFrom(this.userService.UpdateUser(data));
    console.log('✌️response --->', response);
    return response.user;
  }

  @Mutation(() => Boolean)
  async deleteUser(@Args('id') id: string) {
    this.logger.log('Deleting User with ID: ', id);
    const request: DeleteUserRequest = { id };
    const response = await lastValueFrom(this.userService.DeleteUser(request));
    console.log('✌️response --->', response);
    console.log('✌️response --->', response.success);

    // Ensure you're returning the success field from gRPC response
    return response.success;
  }

  @Mutation(() => String)
  async login(@Args('data') data: any) {
    const user = await this.appService.validateUser(data);
    if (!user) {
      throw new Error('Invalid credentials');
    }
    const token = await this.appService.login(data);
    return token;
  }
}
