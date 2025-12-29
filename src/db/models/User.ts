import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  ModelStatic,
  Optional,
  Sequelize,
} from "sequelize";

export class User extends Model<
  InferAttributes<User>,
  InferCreationAttributes<User>
> {
  declare id: CreationOptional<string>;
  declare email: string;
  declare password: string;
  declare refreshTokenHash: CreationOptional<string | null>;
  declare readonly createdAt: CreationOptional<Date>;
  declare readonly updatedAt: CreationOptional<Date>;
}

export function initializeUserModel(sequelize: Sequelize): ModelStatic<User> {
  return sequelize.define<User>(
    "User",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      refreshTokenHash: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: "refresh_token_hash",
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
      tableName: "users",
      modelName: "User",
      timestamps: true,
      underscored: true,
      indexes: [
        {
          unique: true,
          fields: ["email"],
        },
      ],
    }
  );
}

export type UserModelStatic = ModelStatic<User>;

export type CreateUserInput = Optional<
  InferCreationAttributes<User>,
  "id" | "refreshTokenHash" | "createdAt" | "updatedAt"
>;

export type UpdateUserInput = Partial<
  Pick<InferAttributes<User>, "email" | "password" | "refreshTokenHash">
>;
