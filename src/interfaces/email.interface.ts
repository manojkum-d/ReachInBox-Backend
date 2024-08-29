export interface Email {
  id: number;
  subject: string;
  body: string;
  sender: string;
  receivedAt: Date;
  category: string;
  responseSent: boolean;
  userId: number;
}
