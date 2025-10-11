import express, { Request, Response } from "express";
import prisma from "./db";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get("/ping", (_req: Request, res: Response) => {
	res.json({ message: "pong" });
});

// Example endpoint to get all users
app.get("/users", async (_req: Request, res: Response) => {
	try {
		const users = await prisma.user.findMany();
		res.json(users);
	} catch (error) {
		res.status(500).json({ error: "Failed to fetch users" });
	}
});

// Example endpoint to create a user
app.post("/users", async (req: Request, res: Response) => {
	try {
		const { email, name } = req.body;
		const user = await prisma.user.create({
			data: { email, name },
		});
		res.status(201).json(user);
	} catch (error) {
		res.status(500).json({ error: "Failed to create user" });
	}
});

app.listen(PORT, () => {
	console.log(`Server listening on http://localhost:${PORT}`);
	console.log(`Database: ${process.env.DATABASE_URL || "postgresql://localhost:5432/lennc"}`);
});

