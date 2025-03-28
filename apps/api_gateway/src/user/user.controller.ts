import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiResponse, ApiTags } from "@nestjs/swagger";
import { CheckPermissions } from "src/global/decorators/check-permission.decorator";
import { PermissionGuard } from "src/global/guards/permission.guard";
import { Action } from "src/types/permissions";
import { JwtAuthGuard } from "../global/guards/jwt-auth.guard";
import { CreateUserDto } from "./dto/create-user.dto";
import { LoginDto } from "./dto/login.dto";
import { AuthService } from "src/services/auth/auth.service";
import { UserService } from "src/services/user/user.service";

@ApiTags("user")
@Controller("user")
export class UserController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService
  ) {}

  @ApiResponse({
    status: 201,
    description: "User created",
    example: {
      message: "User Created",
      user: {
        id: 1,
        token: "token",
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: "Internal Server Error",
  })
  @CheckPermissions((ability) => ability.can(Action.WRITE, "User"))
  @Post("register")
  async register(@Body() user: CreateUserDto) {
    const newUser = await this.authService.register(user);

    return {
      message: "User created",
      user: {
        id: newUser.id,
        token: newUser.token,
      },
    };
  }

  @Post("login")
  @ApiResponse({
    status: 200,
    description: "Login successful",
    example: {
      message: "Success",
      token: "token",
    },
  })
  @ApiResponse({
    status: 500,
    description: "Internal Server Error",
  })
  async login(@Body() login: LoginDto) {
    const token = await this.authService.login(login);

    return {
      message: "Login successful",
      token,
    };
  }

  @ApiResponse({
    status: 200,
    description: "Fetched users",
  })
  @ApiResponse({
    status: 500,
    description: "Internal Server Error",
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @CheckPermissions((ability) => ability.can(Action.READ, "User"))
  @Get()
  async getUsers() {
    const users = await this.userService.getAll();

    return {
      message: "Users retrieved successfully",
      users,
    };
  }
}
