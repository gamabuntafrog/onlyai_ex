import {
  User,
  UserModelStatic,
  CreateUserInput,
  UpdateUserInput,
} from "@db/models/User";
import { BaseRepository } from "./BaseRepository";

class UserRepository extends BaseRepository<
  User,
  CreateUserInput,
  UpdateUserInput
> {
  constructor(userModel: UserModelStatic) {
    super(userModel);
  }

  /**
   * Find a user by email address (case-insensitive)
   */
  public async findByEmail(email: string): Promise<User | null> {
    return await this.model.findOne({
      where: { email: email.toLowerCase().trim() },
    });
  }
}

export default UserRepository;
