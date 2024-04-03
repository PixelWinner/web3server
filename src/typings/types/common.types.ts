import { MessageType } from "../enums/common.enums";

export type TMessage = {
    id: string;
    userId: string;
    text: string;
    sender: string;
    chatId: string
    type: MessageType;
    transactions: Transaction[]
}

export type UserMessage = {
    userId: string;
    text: string;
    userName: string;
    chatId: string
}

export type JoinData = {
    userId: string;
    userName: string;
    chatId: string;
}

export type Chats = Record<string, TMessage[]>

export type Transaction = {
    txId: string,
    from: string,
    to: string,
    date: Date
    value: string
}