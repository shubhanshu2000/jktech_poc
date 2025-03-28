import { Global, Module } from "@nestjs/common";
import { CaslModule } from "./modules/casl/cals.module";

@Global()
@Module({
  imports: [CaslModule],
  providers: [],
  exports: [CaslModule],
})
export class GlobalModule {}
