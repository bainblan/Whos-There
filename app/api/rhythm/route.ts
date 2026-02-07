import {NextResponse } from "next/server"; 
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

//initialize google generative ai client 
const genAI = new GoogleGenerativeAI(process.en.GEMINI_API_KEY || "");

//rhythm schema 
const rhythmSchema = { 
	description: "Rhythm data for a door knocker", 
	type: SchemaType.OBJECT
	properties: {
		description: {
			type: SchemaType.STRING,
			description: "short name for rhythm" 
			nullable: false,
		},
		intervals: {
			type: SchemaType.ARRAY, 
			description: "An array of integers representing the milliseconds of silence between each knock."
			items: { type: SchemaType.NUMBER },
			nullable: false,
		},
	},
	required: ["description", "intervals"],
};

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { mode, userPrompt } = body; 

		let promptText = "";

		const formatInstruction = "Return the rhythm strictly as a list of time intervals (in milliseconds) representing the silence between impacts.";

		if (mode === "random") {
			promptText = 'Generate a random, catchy, knocking rhythm. ${formatInstruction}';
		} else { 
			promptText = 'Generate a knocking rhythm based on this description: "${userPrompt}", ${formatInstruction} Capture the specific vibe or pattern described.';
		}

		const model = genAI.getGenerativeModel({
			model: "gemini-1.5-flash",
			generationConfig: {
				responseMimeType: "application/json",
				responseSchema: rhythmSchema,
			},
		});

		const result = await model.generateContent(promptText);
		const rhythmData = JSON.parse(result.response.text());

		return NextResponse.json(rhythmData);

	} catch (error) {
		console.error("AI Generation Error: ", error);
		return NextResponse.json(
			{error: "Failed to generate rhythm" },
			{status: 500}
		);
	}
}