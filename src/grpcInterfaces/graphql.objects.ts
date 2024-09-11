import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class UserType {
  @Field(() => ID)
  id: string;

  @Field()
  userName: string;

  @Field()
  email: string;

  @Field({ nullable: true })
  password?: string;
}

@ObjectType()
export class BookType {
  @Field(() => ID)
  id: string;

  @Field()
  title: string;

  @Field()
  description: string;

  @Field()
  author: string;
}
