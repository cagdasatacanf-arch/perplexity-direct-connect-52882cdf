import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.21.0"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const genAI = new GoogleGenerativeAI(Deno.env.get("GEMINI_API_KEY")!)

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { symbol, data, analysis_type } = await req.json()

        // 1. Validation
        if (!symbol || !data || !analysis_type) {
            throw new Error("Missing required fields: symbol, data, or analysis_type")
        }

        // Read the system instruction relative to the function directory
        let systemInstruction
        try {
            systemInstruction = await Deno.readTextFile("../prompts/market_analysis.txt")
        } catch (e) {
            console.error("Error reading prompt file:", e)
            // Fallback instruction if file missing (resilience)
            systemInstruction = "You are a financial analyst. Output valid JSON only."
        }

        // 2. Model Routing
        // Use Pro for complex patterns like Bollinger Bands (specifically BB_BREAK), Flash for speed on others
        const isBollingerAnalysis = analysis_type && (
            analysis_type.toLowerCase().includes("bollinger") ||
            analysis_type === "BB_BREAK"
        );

        const modelName = isBollingerAnalysis ? "gemini-1.5-pro" : "gemini-1.5-flash";
        console.log(`Processing ${symbol} analysis (${analysis_type}) using ${modelName}`)

        const model = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: systemInstruction
        })

        const prompt = `Analyze the following data for ${symbol} using ${analysis_type} logic: ${JSON.stringify(data)}`

        const result = await model.generateContent(prompt)
        const responseText = result.response.text()

        // 3. Robust JSON Parsing
        let cleanResponse = responseText
        if (responseText.includes("```json")) {
            cleanResponse = responseText.split("```json")[1].split("```")[0].trim()
        } else if (responseText.includes("```")) {
            cleanResponse = responseText.split("```")[1].split("```")[0].trim()
        }

        let analysisData
        try {
            analysisData = JSON.parse(cleanResponse)
        } catch (e) {
            console.error("LLM returned invalid JSON:", responseText)
            throw new Error("Failed to parse LLM response as JSON")
        }

        // 4. Return Response
        return new Response(JSON.stringify({
            symbol,
            analysis: analysisData,
            model_used: modelName,
            created_at: new Date().toISOString()
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        })

    } catch (err) {
        const error = err as Error
        console.error("Error in gemini-analyze:", error)
        return new Response(JSON.stringify({
            error: error.message,
            details: error.stack
        }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        })
    }
})
