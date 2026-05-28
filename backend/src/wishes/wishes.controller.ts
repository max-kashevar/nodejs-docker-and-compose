import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { WishesService } from './wishes.service';
import { AuthGuard } from '@nestjs/passport';
import { CreateWishDto } from './dto/create-wish.dto';
import { UpdateWishDto } from './dto/update-wish.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('wishes')
export class WishesController {
  constructor(private readonly wishesService: WishesService) {}

  @Get('last')
  findLast() {
    return this.wishesService.findLast();
  }

  @Get('top')
  findTop() {
    return this.wishesService.findTop();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.wishesService.findOne({ id });
  }

  @UseGuards(AuthGuard('jwt'))
  @Post()
  create(
    @Req() req: Request & { user: { id: number; username: string } },
    @Body() dto: CreateWishDto,
  ) {
    return this.wishesService.createForUser(req.user.id, dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  update(
    @Req() req: Request & { user: { id: number; username: string } },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateWishDto,
  ) {
    return this.wishesService.updateOwnWish(req.user.id, id, dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  remove(
    @Req() req: Request & { user: { id: number; username: string } },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.wishesService.removeOwnWish(req.user.id, id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/copy')
  copy(
    @Req() req: Request & { user: { id: number; username: string } },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.wishesService.copyWish(req.user.id, id);
  }
}
