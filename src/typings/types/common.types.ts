import { MessageType } from "../enums/common.enums";

export type TMessage = {
    id: string;
    text: string;
    sender: string;
    chatId: string
    type: MessageType;
    transactions: Transaction[]
}

export type UserMessage = {
    text: string;
    userName: string;
    chatId: string
}

export type JoinData = {
    userName: string;
    chatId: string;
}

export type Chats = Record<string, TMessage[]>

export type Transaction = {
    txId: string,
    from: string,
    to: string,
    date: Date
    v: number
}