import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { CreateUserDto } from "../../user/dto/create-user.dto";
import { LoginDto } from "../../user/dto/login.dto";
import { UserService } from "../user/user.service";

@Injectable()
export class AuthService {
  constructor(private readonly userService: UserService) {}

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
   * A helper function to throw a custom error message
   * @param message custom error message
   */
  private failLogin(message = "Login failed") {
    throw new HttpException(message, HttpStatus.BAD_REQUEST);
  }
}
