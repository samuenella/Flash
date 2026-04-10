import { Client, TablesDB, ID } from "react-native-appwrite";

const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!;
const COLLECTION_ID = process.env.EXPO_PUBLIC_APPWRITE_COLLECTION_ID!;

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
        await db.createRow(DATABASE_ID, COLLECTION_ID, ID.unique(), {
            Category: category,
            CorrectAnswer: correct_answer,
            WrongAnswer: wrong_answer,
        });
    } catch (error) {
        console.log(error);
        throw error;
    }
};
