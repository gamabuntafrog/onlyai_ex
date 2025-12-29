import {
  Model,
  ModelStatic,
  FindOptions,
  Transaction,
  InferCreationAttributes,
  InferAttributes,
} from "sequelize";

type TransactionOptions = {
  transaction?: Transaction;
};

export abstract class BaseRepository<
  TModel extends Model<
    InferAttributes<TModel> & { id: string },
    InferCreationAttributes<TModel>
  >,
  TCreateInput,
  TUpdateInput,
> {
  constructor(protected readonly model: ModelStatic<TModel>) {}

  /**
   * Find multiple records matching the given options
   * Provides autocompletion for model attributes in where clauses and other options
   */
  public async find(
    options?: FindOptions<InferAttributes<TModel>>
  ): Promise<TModel[]> {
    return await this.model.findAll(
      options as unknown as Parameters<ModelStatic<TModel>["findAll"]>[0]
    );
  }

  /**
   * Find a single record matching the given options
   * Provides autocompletion for model attributes in where clauses and other options
   */
  public async findOne(
    options?: FindOptions<InferAttributes<TModel>>
  ): Promise<TModel | null> {
    return await this.model.findOne(
      options as unknown as Parameters<ModelStatic<TModel>["findOne"]>[0]
    );
  }

  /**
   * Find a record by its primary key (id)
   */
  public async findById(id: string): Promise<TModel | null> {
    return await this.model.findByPk(id);
  }

  /**
   * Create a new record
   */
  public async create(
    data: TCreateInput,
    options: TransactionOptions = {}
  ): Promise<TModel> {
    // Type assertion is safe here because TCreateInput is designed to be compatible
    // with the model's creation attributes, but TypeScript can't verify this statically
    // due to Sequelize's complex type system. Using unknown is safer than any.
    return await (
      this.model.create as (
        values: unknown,
        options?: TransactionOptions
      ) => Promise<TModel>
    )(data, options);
  }

  /**
   * Update a record by its primary key (id)
   */
  public async updateById(
    id: string,
    data: TUpdateInput,
    options: TransactionOptions = {}
  ): Promise<TModel | null> {
    const [updatedCount] = await this.model.update(
      data as unknown as Parameters<ModelStatic<TModel>["update"]>[0],
      {
        where: { id },
        returning: false,
        ...options,
      } as unknown as Parameters<ModelStatic<TModel>["update"]>[1]
    );

    if (updatedCount === 0) {
      return null;
    }

    return await this.findById(id);
  }

  /**
   * Delete a record by its primary key (id)
   */
  public async deleteById(id: string): Promise<boolean> {
    const deletedCount = await this.model.destroy({
      where: { id },
    } as unknown as Parameters<ModelStatic<TModel>["destroy"]>[0]);

    return deletedCount > 0;
  }
}
