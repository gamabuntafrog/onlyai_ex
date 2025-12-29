import {
  Model,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Sequelize,
  ModelStatic,
} from "sequelize";

export class Chat extends Model<
  InferAttributes<Chat>,
  InferCreationAttributes<Chat>
> {
  declare id: string;
  declare name: string;
  declare createdAt: Date;
  declare updatedAt: Date;
}

export function initializeChatModel(sequelize: Sequelize): ModelStatic<Chat> {
  return sequelize.define<Chat>(
    "Chat",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: "created_at",
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: "updated_at",
      },
    },
    {
      tableName: "chats",
      modelName: "Chat",
      timestamps: true,
      underscored: true,
      indexes: [
        {
          unique: true,
          fields: ["name"],
        },
      ],
    }
  );
}
