import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Statistic } from './statistic.model';
import { StatisticsService } from './statistics.service';

@Module({
    imports: [SequelizeModule.forFeature([Statistic])],
    providers: [StatisticsService],
    exports: [StatisticsService],
})
export class StatisticsModule { }