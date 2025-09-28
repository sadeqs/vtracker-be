import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Brand } from './brand.model';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';

@Injectable()
export class BrandService {
  constructor(
    @InjectModel(Brand)
    private brandModel: typeof Brand,
  ) {}

  async findAllByUser(userId: number): Promise<Brand[]> {
    return this.brandModel.findAll({
      where: { userId },
      order: [['name', 'ASC']],
    });
  }

  async create(userId: number, createBrandDto: CreateBrandDto): Promise<Brand> {
    return this.brandModel.create({
      ...createBrandDto,
      userId,
    } as any);
  }

  async findOne(id: number, userId: number): Promise<Brand> {
    const brand = await this.brandModel.findOne({
      where: { id, userId },
    });

    if (!brand) {
      throw new NotFoundException(`Brand with ID ${id} not found`);
    }

    return brand;
  }

  async update(
    id: number,
    userId: number,
    updateBrandDto: UpdateBrandDto,
  ): Promise<Brand> {
    const brand = await this.findOne(id, userId);
    await brand.update(updateBrandDto);
    return brand;
  }

  async remove(id: number, userId: number): Promise<void> {
    const brand = await this.findOne(id, userId);
    await brand.destroy();
  }
}
