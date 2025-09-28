import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BrandService } from './brand.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';

@UseGuards(JwtAuthGuard)
@Controller('brands')
export class BrandController {
  constructor(private readonly brandService: BrandService) {}

  @Post()
  create(@Request() req, @Body() createBrandDto: CreateBrandDto) {
    return this.brandService.create(req.user.userId, createBrandDto);
  }

  @Get()
  findAll(@Request() req) {
    return this.brandService.findAllByUser(req.user.userId);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.brandService.findOne(+id, req.user.userId);
  }

  @Patch(':id')
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateBrandDto: UpdateBrandDto,
  ) {
    return this.brandService.update(+id, req.user.userId, updateBrandDto);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.brandService.remove(+id, req.user.userId);
  }
}
