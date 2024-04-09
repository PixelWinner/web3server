import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { EventType, MessageType } from "../../typings/enums/common.enums";
import { Chats, JoinData, TMessage, Transaction, User, UserMessage, UsersMap } from "../../typings/types/common.types";
import { v4 } from "uuid";
import * as process from "process";
import { Web3 } from "web3";


@WebSocketGateway(5000, {
    cors: "*:*"
})
export class ChatGateway {
    @WebSocketServer() server: Server;

    private users: UsersMap = new Map();
    private chats: Chats = {};
    private web3 = new Web3(`https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`);


    handleConnection(@ConnectedSocket() client: Socket) {
        client.emit(EventType.LOAD_USER_ID, client.id);
    }

    handleDisconnect(client: Socket) {
        this.removeUser(client.id);
    }

    @SubscribeMessage(EventType.JOIN)
    handleJoin(@MessageBody() data: JoinData, @ConnectedSocket() client: Socket) {
        const { chatId, userName } = data;
        const user = { id: client.id, userName, chatId };

        this.addUser(user);

        const message: TMessage = {
            id: v4(),
            userId: v4(),
            sender: "System",
            type: MessageType.SYSTEM,
            text: `${data.userName} has joined the chat!`,
            transactions: []
        };

        if (!this.chats[chatId]) {
            this.chats[chatId] = [message];
        } else {
            this.chats[chatId].push(message);
        }

        this.server.to(chatId).emit(EventType.MESSAGE, message);
    }

    @SubscribeMessage(EventType.LEAVE)
    handleLeave(@ConnectedSocket() client: Socket) {
        this.removeUser(client.id);
    }

    @SubscribeMessage(EventType.LOAD_MESSAGES)
    handleLoadMessages(@ConnectedSocket() client: Socket) {
        const user = this.findUserById(client.id);

        if (!user.chatId) {
            return;
        }

        client.join(user.chatId);
        client.emit(EventType.LOAD_MESSAGES, this.chats[user.chatId] ?? []);
    }

    @SubscribeMessage(EventType.MESSAGE)
    async handleChatMessage(@MessageBody() userMessage: UserMessage, @ConnectedSocket() client: Socket) {
        const { text } = userMessage;
        const user = this.findUserById(client.id);

        if (!user?.chatId) {
            return;
        }

        const txIds: string[] = this.extractTxIds(text);

        const message: TMessage = {
            id: v4(),
            userId: client.id,
            sender: user.userName,
            type: MessageType.USER,
            text,
            transactions: []
        };

        try {
            message.transactions = await this.getTxIdsInfo(txIds);
        } catch (e) {
            console.log(e);
        }


        if (!this.chats[user.chatId]) {
            this.chats[user.chatId] = [message];
        } else {
            this.chats[user.chatId].push(message);
        }

        this.server.to(user.chatId).emit(EventType.MESSAGE, message);
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

    private addUser(user: User) {
        this.users.set(user.id, user);
    }

    private removeUser(userId: string) {
        this.users.delete(userId);
    }

    private findUserById(userId: string): User | undefined {
        return this.users.get(userId);
    }
}

