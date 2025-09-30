import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Question } from '../questions/question.model';

@Table({ tableName: 'Statistics' })
export class Statistic extends Model<Statistic> {
    @Column({ primaryKey: true, autoIncrement: true, type: DataType.INTEGER })
    declare id: number;

    @ForeignKey(() => Question)
    @Column({ 
        type: DataType.INTEGER, 
        allowNull: false,
        field: 'questionId' // Explicitly specify the database column name
    })
    declare questionId: number;

    @Column({ type: DataType.JSONB, allowNull: true, defaultValue: {} })
    declare chatgpt: Record<string, any>;

    @Column({ type: DataType.JSONB, allowNull: true, defaultValue: {} })
    declare gemini: Record<string, any>;

    @BelongsTo(() => Question)
    question: Question;
}