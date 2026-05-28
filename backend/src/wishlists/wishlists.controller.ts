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
import { WishlistsService } from './wishlists.service';
import { AuthGuard } from '@nestjs/passport';
import { CreateWishlistDto } from './dto/create-wishlist.dto';
import { UpdateWishlistDto } from './dto/update-wishlist.dto';

@Controller('wishlistlists')
export class WishlistsController {
  constructor(private readonly wishlistsService: WishlistsService) {}

  @Get()
  findAll() {
    return this.wishlistsService.findMany({});
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.wishlistsService.findOne({ id });
  }

  @UseGuards(AuthGuard('jwt'))
  @Post()
  create(
    @Req() req: Request & { user: { id: number; username: string } },
    @Body() dto: CreateWishlistDto,
  ) {
    return this.wishlistsService.createForUser(req.user.id, dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  update(
    @Req() req: Request & { user: { id: number; username: string } },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateWishlistDto,
  ) {
    return this.wishlistsService.updateOwnWishlist(req.user.id, id, dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  remove(
    @Req() req: Request & { user: { id: number; username: string } },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.wishlistsService.removeOwnWishlist(req.user.id, id);
  }
}
