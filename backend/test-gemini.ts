import { GoogleAIProvider } from './src/services/ai-providers/google.provider'
import dotenv from 'dotenv'

dotenv.config()

async function run() {
    const apiKey = process.env.GOOGLE_API_KEY
    if (!apiKey) {
        console.error('GOOGLE_API_KEY nao encontrada no .env')
        return
    }

    const provider = new GoogleAIProvider({ apiKey })

    const modelsToTest = ['gemini-3.1-pro-preview', 'gemini-2.0-flash']

    for (const model of modelsToTest) {
        console.log(`\n--- Testando modelo: ${model} ---`)
        try {
            // Usar AbortController para timeout de 30s
            const controller = new AbortController()
            const timeout = setTimeout(() => controller.abort(), 30000)

            console.time(`Tempo ${model}`)

            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: "Responda apenas com 'OK'" }] }]
                    }),
                    signal: controller.signal
                }
            )

            clearTimeout(timeout)
            console.timeEnd(`Tempo ${model}`)

            console.log(`Status HTTP: ${response.status} ${response.statusText}`)
            const data = await response.json()

            if (!response.ok) {
                console.error('Erro retornado:', JSON.stringify(data, null, 2))
            } else {
                console.log('Sucesso! Resposta:', data.candidates?.[0]?.content?.parts?.[0]?.text)
            }
        } catch (e: any) {
            console.timeEnd(`Tempo ${model}`)
            console.error(`Erro ao testar ${model}:`, e.message)
        }
    }
}

run()
