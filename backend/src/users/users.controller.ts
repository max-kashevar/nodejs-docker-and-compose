import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { FindUsersDto } from './dto/find-users.dto';

type JwtRequest = Request & { user: { id: number; username: string } };

@UseGuards(AuthGuard('jwt'))
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  findOwn(@Req() req: JwtRequest) {
    return this.usersService.findOwnProfile(req.user.id);
  }

  @Patch('me')
  updateOwn(@Req() req: JwtRequest, @Body() dto: UpdateUserDto) {
    return this.usersService.updateOwnProfile(req.user.id, dto);
  }

  @Get(':username')
  findOne(@Param('username') username: string) {
    return this.usersService.findPublicProfile(username);
  }

  @Get('me/wishes')
  getOwnWishes(@Req() req: JwtRequest) {
    return this.usersService.getOwnWishes(req.user.id);
  }

  @Get(':username/wishes')
  getWishes(@Param('username') username: string) {
    return this.usersService.getWishesByUsername(username);
  }

  @Post('find')
  findMany(@Body() dto: FindUsersDto) {
    return this.usersService.searchUsers(dto.query);
  }
}
