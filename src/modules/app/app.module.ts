import { ConfigModule } from "@nestjs/config";
import { Module } from "@nestjs/common";

import { ChatGateway } from "../../gatewayes/chat/chat.gateway";

@Module({
    imports: [ConfigModule.forRoot({ envFilePath: ".env" })],
    providers: [ChatGateway]
})
export class AppModule {
}
