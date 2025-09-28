import {
    Table,
    Column,
    Model,
    DataType,
    ForeignKey,
    BelongsTo,
    HasMany,
} from 'sequelize-typescript';
import { User } from '../users/user.model';
import { Brand } from '../brand/brand.model';
import { Statistic } from '../statistics/statistic.model';

@Table({ tableName: 'Questions' })
export class Question extends Model<Question> {
    @Column({ primaryKey: true, autoIncrement: true, type: DataType.INTEGER })
    declare id: number;

    @ForeignKey(() => User)
    @Column({ type: DataType.INTEGER, allowNull: false })
    declare userId: number;

    @Column({ type: DataType.STRING, allowNull: false })
    declare text: string;

    @Column({ type: DataType.TEXT, allowNull: true })
    declare answer: string;

    @Column({ type: DataType.TEXT, allowNull: true })
    declare geminiAnswer: string;

    @ForeignKey(() => Brand)
    @Column({ type: DataType.INTEGER, allowNull: true })
    declare brandId: number;

    @BelongsTo(() => User)
    user: User;

    @BelongsTo(() => Brand)
    brand: Brand;

    @HasMany(() => Statistic)
    statistics: Statistic[];
}
