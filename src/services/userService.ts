import UserRepository from "@repositories/UserRepository";
import { NotFoundError } from "@errors/AppError";
import { ERROR_CODES } from "@constants/errorCodes";

export interface UserData {
  id: string;
  email: string;
}

class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  /**
   * Get user by ID
   * @throws NotFoundError if user not found
   */
  public async getUserById(userId: string): Promise<UserData> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundError("User not found", ERROR_CODES.USER_NOT_FOUND);
    }

    return {
      id: user.id.toString(),
      email: user.email,
    };
  }
}

export default UserService;
