import { ConflictException, Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { HashService } from '../hash/hash.service';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly hashService: HashService,
    private readonly jwtService: JwtService,
  ) {}

  async signUp(dto: CreateUserDto) {
    const exists = await this.usersService.findMany([
      { email: dto.email },
      { username: dto.username },
    ]);
    if (exists.length) {
      throw new ConflictException(
        'Пользователь с таким email или username уже зарегестрирован',
      );
    }

    const user = await this.usersService.create({
      ...dto,
      password: await this.hashService.hash(dto.password),
    });

    return {
      id: user.id,
      username: user.username,
      about: user.about,
      avatar: user.avatar,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async validateUser(username: string, password: string) {
    const user = await this.usersService.findOne({ username });
    if (!user) {
      return null;
    }

    const ok = await this.hashService.compare(password, user.password);

    return ok ? user : null;
  }

  login(user: { id: number; username: string }) {
    return {
      access_token: this.jwtService.sign({
        sub: user.id,
        username: user.username,
      }),
    };
  }
}
