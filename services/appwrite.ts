import { Client, TablesDB, ID } from "react-native-appwrite";

const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!;

const client = new Client()
	.setEndpoint("https://sgp.cloud.appwrite.io/v1")
	.setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!);

const db = new TablesDB(client);

export const addWrongAnswer = async (
	category: string,
	correct_answer: string,
	wrong_answer: string,
) => {
	try {
		await db.createRow(DATABASE_ID, "wrong_answers", ID.unique(), {
			Category: category,
			CorrectAnswer: correct_answer,
			WrongAnswer: wrong_answer,
		});
	} catch (error) {
		console.log(error);
		throw error;
	}
};

export const addFeedback = async (feedback: string) => {
	try {
		await db.createRow(DATABASE_ID, "feedback", ID.unique(), {
			Feedback: feedback,
		});
	} catch (error) {
		console.log(error);
		throw error;
	}
};

export const addLeaderboard = async (
	username: string,
	score: number,
	time_taken: number,
) => {
	try {
		await db.createRow(DATABASE_ID, "daily_leaderboard", ID.unique(), {
			Username: username,
			Score: score,
			TimeTaken: time_taken,
		});
	} catch (error) {
		console.log(error);
		throw error;
	}
};

type LeaderboardEntry = {
	createdAt: string;
	Username: string;
	Score: number;
	TimeTaken: number;
};

export const getLeaderboard = async () => {
	try {
		const response = await db.listRows(DATABASE_ID, "daily_leaderboard");
		const entries: LeaderboardEntry[] = response.rows.map((row: any) => ({
			createdAt: row.$createdAt,
			Username: row.Username,
			Score: row.Score,
			TimeTaken: row.TimeTaken,
		}));
		return entries;
	} catch (error) {
		console.log(error);
		throw error;
	}
};

export const clearLeaderboard = async () => {
	try {
		while (true) {
			const response = await db.listRows(
				DATABASE_ID,
				"daily_leaderboard",
			);
			const rows = response.rows;

			if (rows.length === 0) break;

			await Promise.all(
				rows.map((row: any) =>
					db.deleteRow(DATABASE_ID, "daily_leaderboard", row.$id),
				),
			);
		}
	} catch (error) {
		console.log(error);
		throw error;
	}
};
