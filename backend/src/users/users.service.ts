import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity/user.entity';
import { DeepPartial, FindOptionsWhere, Repository } from 'typeorm';
import { UpdateUserDto } from './dto/update-user.dto';
import { HashService } from '../hash/hash.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly hashService: HashService,
  ) {}

  private toProfile(user: User) {
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

  private toPublicProfile(user: User) {
    return {
      id: user.id,
      username: user.username,
      about: user.about,
      avatar: user.avatar,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  create(value: DeepPartial<User>) {
    const user = this.userRepository.create(value);
    return this.userRepository.save(user);
  }

  findOne(query: FindOptionsWhere<User>) {
    return this.userRepository.findOne({ where: query });
  }

  findMany(query: FindOptionsWhere<User> | FindOptionsWhere<User>[]) {
    return this.userRepository.find({ where: query });
  }

  async updateOne(query: FindOptionsWhere<User>, data: DeepPartial<User>) {
    const user = await this.findOne(query);
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    await this.userRepository.update({ id: user.id }, data);
    return this.findOne({ id: user.id });
  }

  async removeOne(query: FindOptionsWhere<User>) {
    const user = await this.findOne(query);
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    await this.userRepository.remove(user);
    return user;
  }

  async findOwnProfile(userId: number) {
    const user = await this.findOne({ id: userId });
    if (!user) throw new NotFoundException('Пользователь не найден');
    return this.toProfile(user);
  }

  async findPublicProfile(username: string) {
    const user = await this.findOne({ username });
    if (!user) throw new NotFoundException('Пользователь не найден');
    return this.toPublicProfile(user);
  }

  async updateOwnProfile(userId: number, dto: UpdateUserDto) {
    const data: DeepPartial<User> = { ...dto };

    if (dto.password) {
      data.password = await this.hashService.hash(dto.password);
    }

    await this.updateOne({ id: userId }, data);

    const updated = await this.findOne({ id: userId });
    if (!updated) throw new NotFoundException('Пользователь не найден');
    return this.toProfile(updated);
  }

  async getOwnWishes(userId: number) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: { wishes: { offers: { user: true } } },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    return user.wishes;
  }

  async getWishesByUsername(username: string) {
    const user = await this.userRepository.findOne({
      where: { username },
      relations: { wishes: { offers: { user: true } } },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    return user.wishes;
  }

  async searchUsers(query: string) {
    const users = await this.findMany([{ username: query }, { email: query }]);
    return users.map((u) => this.toProfile(u));
  }
}
