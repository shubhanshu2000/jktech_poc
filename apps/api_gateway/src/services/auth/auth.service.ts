import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { CreateUserDto } from "../../user/dto/create-user.dto";
import { LoginDto } from "../../user/dto/login.dto";
import { UserService } from "../user/user.service";
import { ConfigService } from "@nestjs/config";
import { RedisService } from "../redis/redis.service";

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService
  ) {}

  /**
   * Register a new user
   * @param userDto payload to create a new user
   * @returns user object with token
   */
  async register(userDto: CreateUserDto) {
    // check if user exists and send custom error message
    if (await this.userService.isUserExists(userDto.email)) {
      this.failLogin("User already exists");
    }

    const newUser = await this.userService.createUser(userDto);
    const token = this.userService.getUserToken(newUser);

    return { ...newUser, token };
  }

  /**
   * Login a user
   * @param loginRequest payload with credentials
   * @returns token if login is successful
   */
  async login(loginRequest: LoginDto): Promise<string | void> {
    const { email, password } = loginRequest;
    const user = await this.userService.isUserExists(email);

    if (!user) {
      return this.failLogin();
    }

    if (await this.userService.checkUserPassword(user, password)) {
      return this.userService.getUserToken(user);
    }

    this.failLogin("Incorrect password");
  }

  /**
   * Logout a user by blacklisting their token
   * @param token JWT token to blacklist
   */
  async logout(token: string): Promise<void> {
    try {
      const jwtExpiry = this.configService.get("jwt.expiry");
      const expiryInSeconds = this.parseExpiryToSeconds(jwtExpiry);

      await this.redisService.addToBlacklist(token, expiryInSeconds);
    } catch (error) {
      throw new HttpException(
        "Logout failed",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Convert JWT expiry time to seconds
   * @param expiry JWT expiry time (e.g., "2h", "1d")
   * @returns expiry time in seconds
   */
  private parseExpiryToSeconds(expiry: string): number {
    const unit = expiry.slice(-1);
    const value = parseInt(expiry.slice(0, -1));

    switch (unit) {
      case "h":
        return value * 60 * 60;
      case "d":
        return value * 24 * 60 * 60;
      case "m":
        return value * 60;
      case "s":
        return value;
      default:
        return 7200; // 2 hours default
    }
  }

  /**
   * A helper function to throw a custom error message
   * @param message custom error message
   */
  private failLogin(message = "Login failed") {
    throw new HttpException(message, HttpStatus.BAD_REQUEST);
  }
}
