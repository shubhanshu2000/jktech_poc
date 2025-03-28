import { Injectable } from "@nestjs/common";
import { hash, compare } from "bcryptjs";

@Injectable()
export class PasswordService {
  /**
   * Generate a hash for the given password
   * @param rawPassword hash the given passport for storage
   * @returns hashed password
   */
  async generate(rawPassword: string) {
    return await hash(rawPassword, 10);
  }

  /**
   * Compare the given password with the hashed password
   * @param requestPassword user input password
   * @param hash hashed password of ours
   * @returns Boolean whether the password is correct or not
   */
  async compare(requestPassword: string, hash: string): Promise<boolean> {
    return await compare(requestPassword, hash);
  }
}
