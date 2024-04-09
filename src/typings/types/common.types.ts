import { MessageType } from "../enums/common.enums";

export type TMessage = {
    id: string;
    userId: string;
    text: string;
    sender: string;
    type: MessageType;
    transactions: Transaction[]
}

export type User = {
    id: string,
    userName: string;
    chatId: string | null;
}

export type UserMessage = {
    text: string;
    userName: string;
}

export type JoinData = {
    userId: string;
    userName: string;
    chatId: string;
}

export type UsersMap = Map<string, User>

export type Chats = Record<string, TMessage[]>

export type Transaction = {
    txId: string,
    from: string,
    to: string,
    date: Date
    value: string
}