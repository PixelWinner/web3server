import { ConfigModule } from "@nestjs/config";
import { Module } from "@nestjs/common";

import { ChatGateway } from "../../gatewayes/chat/chat.gateway";
import { AppController } from "./app.controller";

@Module({
    imports: [ConfigModule.forRoot({ envFilePath: ".env" })],
    controllers:[AppController],
    providers: [ChatGateway]
})
export class AppModule {
}
