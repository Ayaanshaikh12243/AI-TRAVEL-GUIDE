const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize the Gemini AI model
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const modelIds = [
    "gemini-1.5-pro",
    "gemini-1.5-flash",
    "gemini-1.5-pro-latest",
    "gemini-1.5-flash-latest",
    "gemini-1.0-pro"
];

async function generateWithFallback(prompt) {
    let lastErr;
    for (const id of modelIds) {
        try {
            const mdl = genAI.getGenerativeModel({ model: id });
            const result = await mdl.generateContent(prompt);
            return await result.response;
        } catch (err) {
            lastErr = err;
            continue;
        }
    }
    throw lastErr;
}

function extractJson(text) {
    const cleaned = text.replace(/```json|```/g, "").trim();
    try {
        return JSON.parse(cleaned);
    } catch (_) {
        const match = cleaned.match(/\{[\s\S]*\}/);
        if (match) {
            return JSON.parse(match[0]);
        }
        throw _;
    }
}

function normalizeItinerary(obj) {
    if (obj && obj.ai_reasoning && !obj.aiReasoning) obj.aiReasoning = obj.ai_reasoning;
    return obj;
}

function buildFallbackItinerary(userInput) {
    const { destination = "Your Destination", startDate, endDate, interests = "sightseeing", travelStyle = "standard", pace = "moderate", budget = "medium" } = userInput || {};
    const s = new Date(startDate);
    const e = new Date(endDate);
    const days = [];
    if (!isNaN(s) && !isNaN(e) && e >= s) {
        let cur = new Date(s);
        let idx = 1;
        while (cur <= e) {
            const iso = new Date(cur).toISOString().slice(0, 10);
            days.push({
                day: idx,
                date: iso,
                plan: [
                    { time: "09:00 AM", place: `${destination} City Center`, activity: "Morning walk and coffee", cost: "-", transport: "Walk" },
                    { time: "12:30 PM", place: "Local eatery", activity: "Lunch", cost: "-", transport: "Walk" },
                    { time: "03:00 PM", place: "Top attraction", activity: `Explore ${interests}`, cost: "-", transport: "Public Transit" }
                ],
                alternatives: ["Visit a nearby park", "Try a local dessert"]
            });
            cur.setDate(cur.getDate() + 1);
            idx += 1;
        }
    } else {
        days.push({
            day: 1,
            date: new Date().toISOString().slice(0, 10),
            plan: [
                { time: "10:00 AM", place: `${destination}`, activity: `General ${interests}`, cost: "-", transport: "Walk" }
            ],
            alternatives: ["Photo walk", "Cafe break"]
        });
    }
    return {
        status: "ok",
        title: `${days.length}-Day ${destination} Plan`,
        startDate: startDate || (days[0] && days[0].date) || "",
        endDate: endDate || (days[days.length - 1] && days[days.length - 1].date) || "",
        days,
        budget: typeof budget === "string" ? budget : "",
        aiReasoning: [
            `Fallback itinerary based on ${destination}`,
            `Interests: ${interests}, style: ${travelStyle}, pace: ${pace}`
        ]
    };
}

/**
 * Generates a travel itinerary using the Gemini API.
 * @param {object} userInput - The user's travel preferences.
 * @returns {object} The parsed JSON itinerary object.
 */
async function generateItinerary(userInput) {
    const { destination, startDate, endDate, interests, travelStyle, pace, budget, currency } = userInput;

    const prompt = `
        You are an expert travel planner. Your task is to generate a detailed, day-wise travel itinerary based on user preferences.
        You MUST return ONLY a valid JSON object. Do not include markdown \`\`\`json or any other text before or after the JSON.
        
        User Preferences:
        - Destination: ${destination}
        - Dates: ${startDate} to ${endDate}
        - Interests: ${interests}
        - Travel Style: ${travelStyle}
        - Pace: ${pace}
        - Budget: ${budget}
        - Currency: ${currency || 'USD'}

        IMPORTANT: All cost-related fields in the JSON must be expressed in the specified currency (${currency || 'USD'}). Do not include additional prose outside JSON.

        Required JSON Output Format (no comments, strictly valid JSON):
        {
          "status": "ok",
          "title": "Your Generated Trip Title (e.g., 5-Day Tokyo Adventure)",
          "startDate": "${startDate}",
          "endDate": "${endDate}",
          "days": [
            {
              "day": 1,
              "date": "YYYY-MM-DD",
              "plan": [
                {"time": "9:00 AM", "place": "Place Name", "activity": "Activity Description", "cost": "e.g., $20 or ₹1500", "transport": "e.g., Taxi or Walk"},
                {"time": "12:00 PM", "place": "Lunch Spot", "activity": "Lunch", "cost": "e.g., $15", "transport": "Walk"},
                {"time": "2:00 PM", "place": "Museum Name", "activity": "Explore exhibits", "cost": "e.g., $25", "transport": "Subway"}
              ],
              "alternatives": ["Alternative Activity 1", "Alternative Activity 2"]
            }
          ],
          "budget": "Total estimated cost range (e.g., $1000-$1500 or ₹80000-₹120000 total)",
          "ai_reasoning": [
            "Understanding user preference for ${interests} and ${travelStyle} style.",
            "Matching destination options in ${destination}.",
            "Choosing top attractions based on interests.",
            "Planning a daily flow with a ${pace} pace, optimizing travel time.",
            "Assigning cost estimates based on ${budget} budget and ${travelStyle} style."
          ]
        }

        If you cannot generate a valid itinerary based on the input (e.g., invalid dates or destination), return this exact JSON:
        {"status":"error","message":"Invalid input or date provided."}
    `;

    try {
        const response = await generateWithFallback(prompt);
        const text = response.text();
        let jsonResponse = extractJson(text);
        jsonResponse = normalizeItinerary(jsonResponse);
        if (jsonResponse && jsonResponse.status === "error") return buildFallbackItinerary(userInput);
        if (!jsonResponse || !jsonResponse.title || !jsonResponse.startDate || !jsonResponse.endDate) {
            return buildFallbackItinerary(userInput);
        }
        return jsonResponse;

    } catch (error) {
        console.error("Error in AI generation or JSON parsing:", error);
        return buildFallbackItinerary(userInput);
    }
}

/**
 * Generates 10 suggested travel destinations.
 * @returns {object} JSON object with a list of suggestions.
 */
async function generateSuggestions() {
    const prompt = `
        You are a travel expert. Generate a list of 10 diverse and interesting travel destinations.
        You MUST return ONLY a valid JSON object. Do not include markdown \`\`\`json or any other text before or after the JSON.

        Required JSON Output Format (no comments, strictly valid JSON):
        {
          "suggestions": [
            {
              "name": "Kyoto, Japan",
              "highlights": "Temples, gardens, traditional culture",
              "bestTime": "March-May (Spring) or Oct-Nov (Autumn)"
            },
            {
              "name": "Queenstown, New Zealand",
              "highlights": "Adventure sports, stunning landscapes",
              "bestTime": "Dec-Feb (Summer) or Jun-Aug (Winter)"
            }
          ]
        }
    `;

    try {
        const response = await generateWithFallback(prompt);
        const text = response.text();
        const jsonResponse = extractJson(text);
        if (!jsonResponse || !jsonResponse.suggestions) {
            return { status: "error", message: "Invalid suggestions format returned by AI." };
        }
        return jsonResponse;

    } catch (error) {
        console.error("Error in AI suggestion generation:", error);
        return { suggestions: [] }; // Return empty list on failure
    }
}

module.exports = { generateItinerary, generateSuggestions };