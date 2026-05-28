import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Wishlist } from './entities/wishlist.entity/wishlist.entity';
import { DeepPartial, FindOptionsWhere, Repository } from 'typeorm';
import { Wish } from '../wishes/entities/wish.entity/wish.entity';
import { UsersService } from '../users/users.service';
import { In } from 'typeorm';

@Injectable()
export class WishlistsService {
  constructor(
    @InjectRepository(Wishlist)
    private readonly wishlistRepository: Repository<Wishlist>,
    @InjectRepository(Wish)
    private readonly wishesRepository: Repository<Wish>,
    private readonly usersService: UsersService,
  ) {}

  create(value: DeepPartial<Wishlist>) {
    const wishlist = this.wishlistRepository.create(value);
    return this.wishlistRepository.save(wishlist);
  }

  findOne(query: FindOptionsWhere<Wishlist>) {
    return this.wishlistRepository.findOne({
      where: query,
      relations: { owner: true, items: true },
    });
  }

  findMany(query: FindOptionsWhere<Wishlist> | FindOptionsWhere<Wishlist>[]) {
    return this.wishlistRepository.find({
      where: query,
      relations: { owner: true, items: true },
    });
  }

  async updateOne(
    query: FindOptionsWhere<Wishlist>,
    data: DeepPartial<Wishlist>,
  ) {
    const wishlist = await this.findOne(query);
    if (!wishlist) {
      throw new NotFoundException('Список подарков не найден');
    }

    await this.wishlistRepository.update({ id: wishlist.id }, data);
    return this.findOne({ id: wishlist.id });
  }

  async removeOne(query: FindOptionsWhere<Wishlist>) {
    const wishlist = await this.findOne(query);
    if (!wishlist) {
      throw new NotFoundException('Список подарков не найден');
    }

    await this.wishlistRepository.remove(wishlist);
    return wishlist;
  }

  async createForUser(
    userId: number,
    dto: {
      name: string;
      description?: string;
      image: string;
      itemsId: number[];
    },
  ) {
    const owner = await this.usersService.findOne({ id: userId });
    if (!owner) {
      throw new NotFoundException('Пользователь не найден');
    }

    const items =
      dto.itemsId?.length > 0
        ? await this.wishesRepository.findBy({ id: In(dto.itemsId) })
        : [];

    return this.create({
      name: dto.name,
      description: dto.description ?? '',
      image: dto.image,
      owner,
      items,
    });
  }

  async updateOwnWishlist(
    userId: number,
    wishlistId: number,
    dto: {
      name?: string;
      description?: string;
      image?: string;
      itemsId?: number[];
    },
  ) {
    const wishlist = await this.wishlistRepository.findOne({
      where: { id: wishlistId },
      relations: { owner: true, items: true },
    });

    if (!wishlist) {
      throw new NotFoundException('Список не найден');
    }

    if (wishlist.owner.id !== userId) {
      throw new ForbiddenException('Нельзя редактировать чужой список');
    }

    if (dto.name !== undefined) wishlist.name = dto.name;
    if (dto.description !== undefined) wishlist.description = dto.description;
    if (dto.image !== undefined) wishlist.image = dto.image;

    if (dto.itemsId !== undefined) {
      wishlist.items = dto.itemsId.length
        ? await this.wishesRepository.findBy({ id: In(dto.itemsId) })
        : [];
    }

    return this.wishlistRepository.save(wishlist);
  }

  async removeOwnWishlist(userId: number, wishlistId: number) {
    const wishlist = await this.wishlistRepository.findOne({
      where: { id: wishlistId },
      relations: { owner: true },
    });

    if (!wishlist) {
      throw new NotFoundException('Список не найден');
    }

    if (wishlist.owner.id !== userId) {
      throw new ForbiddenException('Нельзя удалять чужой список');
    }

    return this.removeOne({ id: wishlistId });
  }
}
