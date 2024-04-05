import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { EventType, MessageType } from "../../typings/enums/common.enums";
import { Chats, JoinData, TMessage, Transaction, UserMessage } from "../../typings/types/common.types";
import { v4 } from "uuid";
import * as process from "process";
import { Web3 } from "web3";


@WebSocketGateway(5000, {
    cors: "*:*"
})
export class ChatGateway {
    @WebSocketServer() server: Server;

    private chats: Chats = {};
    private web3 = new Web3(`https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`);


    handleConnection(client: Socket) {
        client.emit(EventType.LOAD_USER_ID, client.id);
    }

    @SubscribeMessage(EventType.JOIN)
    handleJoin(@MessageBody() data: JoinData) {
        const message: TMessage = {
            id: v4(),
            userId: v4(),
            sender: "System",
            chatId: data.chatId,
            type: MessageType.SYSTEM,
            text: `${data.userName} has joined the chat!`,
            transactions: []
        };

        if (!this.chats[data.chatId]) {
            this.chats[data.chatId] = [message];
        } else {
            this.chats[data.chatId].push(message);
        }

        this.server.to(data.chatId).emit(EventType.MESSAGE, message);
    }

    @SubscribeMessage(EventType.LOAD_MESSAGES)
    handleLoadMessages(@MessageBody() chatId: string, @ConnectedSocket() client: Socket) {
        client.join(chatId);
        client.emit(EventType.LOAD_MESSAGES, this.chats[chatId] ?? []);
    }

    @SubscribeMessage(EventType.MESSAGE)
    async handleChatMessage(@MessageBody() { userName, userId, chatId, text }: UserMessage) {
        const txIds: string[] = this.extractTxIds(text);

        const transactions = await this.getTxIdsInfo(txIds);

        const message: TMessage = {
            id: v4(),
            userId,
            sender: userName,
            type: MessageType.USER,
            text,
            chatId,
            transactions
        };

        if (!this.chats[message.chatId]) {
            this.chats[message.chatId] = [message];
        } else {
            this.chats[message.chatId].push(message);
        }

        this.server.to(message.chatId).emit(EventType.MESSAGE, message);
    }

    private extractTxIds(text: string): string[] {
        const txIdPattern = /\b0x[a-fA-F0-9]{64}\b/g;
        const matches = text.match(txIdPattern) || [];
        const uniqueTxIds = new Set(matches);

        return Array.from(uniqueTxIds);
    }

    private async getTxIdsInfo(txIds: string[]): Promise<Transaction[]> {
        if (txIds.length === 0) {
            return [];
        }

        const transactionsInfoPromises = txIds.map(txId => this.getTxInfo(txId));
        const transactionsInfo = await Promise.all(transactionsInfoPromises);

        if (transactionsInfo.length === 0) {
            return [];
        }

        return transactionsInfo;
    }

    private async getTxInfo(txId: string): Promise<Transaction> {
        const transaction = await this.web3.eth.getTransaction(txId);
        const block = await this.web3.eth.getBlock(transaction.blockNumber);
        const valueInEther = this.web3.utils.fromWei(transaction.value, "ether");

        return {
            txId,
            from: transaction.from,
            to: transaction.to,
            date: new Date(Number(block.timestamp) * 1000),
            value: valueInEther
        };
    }
}