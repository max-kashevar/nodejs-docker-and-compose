import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, FindOptionsWhere, Repository } from 'typeorm';
import { Wish } from './entities/wish.entity/wish.entity';
import { CreateWishDto } from './dto/create-wish.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class WishesService {
  constructor(
    @InjectRepository(Wish)
    private readonly wishesRepository: Repository<Wish>,
    private readonly usersService: UsersService,
  ) {}

  create(value: DeepPartial<Wish>) {
    const wish = this.wishesRepository.create(value);
    return this.wishesRepository.save(wish);
  }

  async findOne(query: FindOptionsWhere<Wish>) {
    const wish = await this.wishesRepository.findOne({
      where: query,
      relations: { owner: true, offers: { user: true } },
    });
    if (!wish) {
      throw new NotFoundException('Подарок не найден');
    }
    return wish;
  }

  findMany(query: FindOptionsWhere<Wish> | FindOptionsWhere<Wish>[]) {
    return this.wishesRepository.find({ where: query });
  }

  async updateOne(query: FindOptionsWhere<Wish>, data: DeepPartial<Wish>) {
    const wish = await this.findOne(query);
    if (!wish) {
      throw new NotFoundException('Подарок не найден');
    }

    await this.wishesRepository.update({ id: wish.id }, data);
    return this.findOne({ id: wish.id });
  }

  async removeOne(query: FindOptionsWhere<Wish>) {
    const wish = await this.findOne(query);
    if (!wish) {
      throw new NotFoundException('Подарок не найден');
    }

    await this.wishesRepository.remove(wish);
    return wish;
  }

  findLast() {
    return this.wishesRepository.find({
      relations: { owner: true, offers: { user: true } },
      order: { createdAt: 'DESC' },
      take: 40,
    });
  }

  findTop() {
    return this.wishesRepository.find({
      relations: { owner: true, offers: { user: true } },
      order: { copied: 'DESC' },
      take: 20,
    });
  }

  async createForUser(userId: number, dto: CreateWishDto) {
    const owner = await this.usersService.findOne({ id: userId });
    if (!owner) {
      throw new NotFoundException('Пользователь не найден');
    }

    return this.create({
      ...dto,
      owner,
      copied: 0,
      raised: 0,
    });
  }

  async updateOwnWish(userId: number, wishId: number, dto: DeepPartial<Wish>) {
    const wish = await this.wishesRepository.findOne({
      where: { id: wishId },
      relations: { owner: true, offers: true },
    });

    if (!wish) {
      throw new NotFoundException('Подарок не найден');
    }

    if (wish.owner.id !== userId) {
      throw new ForbiddenException('Нельзя редактировать чужой подарок');
    }

    if (dto.price !== undefined && wish.offers.length > 0) {
      throw new ForbiddenException(
        'Нельзя менять цену, если уже есть скидывающиеся',
      );
    }

    return this.updateOne({ id: wishId }, dto);
  }

  async removeOwnWish(userId: number, wishId: number) {
    const wish = await this.wishesRepository.findOne({
      where: { id: wishId },
      relations: { owner: true },
    });

    if (!wish) {
      throw new NotFoundException('Подарок не найден');
    }

    if (wish.owner.id !== userId) {
      throw new ForbiddenException('Нельзя удалять чужой подарок');
    }

    return this.removeOne({ id: wishId });
  }

  async copyWish(userId: number, wishId: number) {
    const original = await this.wishesRepository.findOne({
      where: { id: wishId },
      relations: { owner: true },
    });

    if (!original) {
      throw new NotFoundException('Подарок не найден');
    }

    const owner = await this.usersService.findOne({ id: userId });
    if (!owner) {
      throw new NotFoundException('Пользователь не найден');
    }

    await this.wishesRepository.update(
      { id: original.id },
      { copied: original.copied + 1 },
    );

    return this.create({
      name: original.name,
      link: original.link,
      image: original.image,
      price: original.price,
      description: original.description,
      owner,
      copied: 0,
      raised: 0,
    });
  }
}
