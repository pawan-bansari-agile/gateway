import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './schemas/users.schema';
import { Model } from 'mongoose';

export class AppService {
  constructor(
    private jwtService: JwtService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  getHello() {
    return 'Hello World';
  }

  async validateUser(data: any) {
    console.log('✌️data from the validate function--->', data);
    const user = await this.userModel.findOne({ email: data.email });
    console.log('✌️user from validate method--->', user);
    const passwordMatch = user.password === data.password ? true : false;
    return passwordMatch;
  }

  async login(data: any) {
    const user = await this.userModel.findOne({ email: data.email });
    console.log('✌️user from login method--->', user);
    const payload = { username: user.userName, id: user.id };
    const access_token = this.jwtService.sign(payload);
    return { access_token };
  }
}
