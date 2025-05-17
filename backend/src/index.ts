import express, { Request, Response } from 'express';
import cors from 'cors';
import { z } from 'zod';

type Message = {
	id: number;
	username: string;
	text: string;
	timestamp: string;
};
const messageSchema = z.object({
	username: z
		.string()
		.min(2, 'Username is required')
		.max(50, 'Username too long'),
	text: z.string().min(1, 'Message is required').max(400, 'Message too long'),
});

function* infiniteSequence() {
	let i = 0;
	while (true) {
		yield ++i;
	}
}

const iterator = infiniteSequence();

const server = express();
const PORT = 4000;

const messages: Message[] = [];

server.use(cors());
server.use(express.json());

server.get('/', function (req: Request, res: Response) {
	res.status(200).json('Hello from backend');
});

server.get('/messages', function (req: Request, res: Response) {
	res.status(200).json([
		...messages,
		{
			id: messages.length,
			username: 'Bot 🤖',
			text: 'Welcome to chat',
			timestamp: new Date().toISOString(),
		},
	]);
});

server.post('/messages', function (req: Request, res: Response) {
	const result = messageSchema.safeParse(req.body);
	if (!result.success) {
		res.status(400).send({
			message: result.error.format(),
		});
		return;
	}
	const { username, text } = req.body;
	const newMessage: Message = {
		id: iterator.next().value as number,
		username,
		text,
		timestamp: new Date().toISOString(),
	};

	messages.push(newMessage);
	res.status(201).send(newMessage);
});

server.listen(PORT, function () {
	console.log(`[server]: Server is running at http://localhost:${PORT}`);
});
