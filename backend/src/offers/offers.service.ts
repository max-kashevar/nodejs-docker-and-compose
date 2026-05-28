import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Offer } from './entities/offer.entity/offer.entity';
import { DeepPartial, FindOptionsWhere, Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { Wish } from '../wishes/entities/wish.entity/wish.entity';

@Injectable()
export class OffersService {
  constructor(
    @InjectRepository(Offer)
    private readonly offerRepository: Repository<Offer>,
    @InjectRepository(Wish)
    private readonly wishesRepository: Repository<Wish>,
    private readonly usersService: UsersService,
  ) {}

  create(value: DeepPartial<Offer>) {
    const offer = this.offerRepository.create(value);
    return this.offerRepository.save(offer);
  }

  findOne(query: FindOptionsWhere<Offer>) {
    return this.offerRepository.findOne({
      where: query,
      relations: { user: true, item: { owner: true } },
    });
  }

  findMany(query: FindOptionsWhere<Offer> | FindOptionsWhere<Offer>[]) {
    return this.offerRepository.find({
      where: query,
      relations: { user: true, item: { owner: true } },
    });
  }

  async updateOne(query: FindOptionsWhere<Offer>, data: DeepPartial<Offer>) {
    const offer = await this.findOne(query);
    if (!offer) {
      throw new NotFoundException('Оффер не найден');
    }

    await this.offerRepository.update({ id: offer.id }, data);
    return this.findOne({ id: offer.id });
  }

  async removeOne(query: FindOptionsWhere<Offer>) {
    const offer = await this.findOne(query);
    if (!offer) {
      throw new NotFoundException('Оффер не найден');
    }

    await this.offerRepository.remove(offer);
    return offer;
  }

  async createForUser(userId: number, dto: CreateOfferDto) {
    const user = await this.usersService.findOne({ id: userId });
    if (!user) throw new NotFoundException('Пользователь не найден');

    const wish = await this.wishesRepository.findOne({
      where: { id: dto.itemId },
      relations: { owner: true },
    });
    if (!wish) throw new NotFoundException('Подарок не найден');

    if (wish.owner.id === userId) {
      throw new ForbiddenException('Нельзя скидываться на свой подарок');
    }

    const price = Number(wish.price);
    const raised = Number(wish.raised);

    if (raised >= price) {
      throw new BadRequestException('Сбор на подарок уже завершён');
    }

    if (raised + dto.amount > price) {
      throw new BadRequestException('Сумма взноса превышает стоимость подарка');
    }

    const offer = this.offerRepository.create({
      amount: dto.amount,
      hidden: dto.hidden ?? false,
      user,
      item: wish,
    });

    const saved = await this.offerRepository.save(offer);
    await this.wishesRepository.update(
      { id: wish.id },
      { raised: raised + dto.amount },
    );

    return saved;
  }
}
