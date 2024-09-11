import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver } from '@nestjs/apollo';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/users.schema';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AppResolver } from './app.resolver';
import { JwtStrategy } from './filters/jwt.strategy';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost/users'),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    PassportModule,
    JwtModule.register({
      secret: 'your-secret-key', // Use environment variables for security
      signOptions: { expiresIn: '60m' }, // Token expiration time
    }),
    GraphQLModule.forRoot({
      driver: ApolloDriver,
      typePaths: ['./**/*.graphql'],
      playground: true,
    }),
    ClientsModule.register([
      {
        name: 'USER_SERVICE',
        transport: Transport.GRPC,
        options: {
          url: `localhost:50052`,
          package: 'app',
          protoPath: join(__dirname, '../src/app.proto'),
        },
      },
    ]),
  ],
  controllers: [AppController],
  providers: [AppService, AppResolver, JwtStrategy],
})
export class AppModule {}
