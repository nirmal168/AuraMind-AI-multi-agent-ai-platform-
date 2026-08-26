import { getModel } from '../config/llmModels.js'
import axios from 'axios'
import { uploadToS3 } from '../utils/uploadToS3.js'
import { getFromS3 } from '../utils/getFromS3.js'
import { deductCredits } from '../utils/deductCredit.js'
import { checkAgentLimit } from '../config/agentLimit.js'

async function findOfficialPhoto(query) {
  if (!query) return null
  try {
    const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrlimit=3&prop=pageimages&pithumbsize=1024&format=json`
    const r = await axios.get(wikiUrl, {
      headers: { 'User-Agent': 'AuraMindAI/1.0 (contact@auramind.ai)' },
      timeout: 4000
    })
    const pages = Object.values(r.data.query?.pages || {})
    for (const page of pages) {
      if (page?.thumbnail?.source && !page.thumbnail.source.endsWith('.svg.png')) {
        return page.thumbnail.source
      }
    }
  } catch (e) {}
  return null
}

export const visionAgent = async state => {
  try {
    const llm = await getModel('vision')
    if (state.userId) {
      try {
        await checkAgentLimit(state.userId, 'vision')
      } catch (err) {
        console.warn('Agent limit check skipped:', err?.message)
      }
    }

    const userPrompt = state.prompt.trim()
    const isNanoBanana = userPrompt.toLowerCase().includes('banana') || userPrompt.toLowerCase().includes('nano')
    const isAnime = userPrompt.toLowerCase().includes('anime') || userPrompt.toLowerCase().includes('manga')
    const is3D = userPrompt.toLowerCase().includes('3d') || userPrompt.toLowerCase().includes('render') || isNanoBanana

    let selectedModel = 'flux-realism'
    if (isAnime) selectedModel = 'flux-anime'
    else if (is3D) selectedModel = 'flux-3d'

    let cleanedPrompt = userPrompt
      .replace(/^(create|generate|draw|make|show|render|give me|find|get)\s+(an?\s+|the\s+)?(images?|pictures?|photos?|portraits?|illustrations?)\s+(of\s+)?/i, '')
      .trim()
    if (!cleanedPrompt) cleanedPrompt = userPrompt

    let enhancedPrompt = cleanedPrompt
    let realPersonName = ''

    try {
      const res = await llm.invoke(`
You are the Qwen Image Engine Prompt Architect.
Convert the user request into an ultra-high-quality image generation prompt.
Also extract the famous celebrity/athlete/person's name if mentioned.

User Request: "${cleanedPrompt}"

Rules:
1. Complete Subject Visibility:
   - Ensure the entire subject is completely in frame (wide angle, full view, zero extreme close-up or accidental cropping).
   - For flags & national symbols: Specify the complete rectangular horizontal flag fully in frame with all exact official colors (e.g. for Indian flag: three equal horizontal bands with deep saffron top, crisp pure white middle with navy blue 24-spoke Ashoka Chakra centered, and rich green bottom), commercial studio lighting, clean background, 8k resolution.
2. Celebrities & Public Figures:
   - Extract their full canonical name.
3. 3D Cartoon / Nano Banana:
   - 3D cartoon mini character in Pixar style, glossy textures, expressive face, 8k Octane render.
4. Keep prompt clear, detailed, and non-abstract (30-50 words).

Respond with ONLY valid JSON:
{
  "famousPersonName": "exact canonical name of famous real person/athlete/leader or NONE",
  "enhancedPrompt": "the clean, high-resolution Qwen image prompt string"
}
`)
      let cleanContent = res.content
      if (typeof cleanContent === 'string') {
        cleanContent = cleanContent.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()
      }
      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0])
          if (parsed.famousPersonName && parsed.famousPersonName !== 'NONE' && parsed.famousPersonName.length > 2) {
            realPersonName = parsed.famousPersonName
          }
          if (parsed.enhancedPrompt) {
            enhancedPrompt = parsed.enhancedPrompt
          }
        } catch (e) {
          enhancedPrompt = cleanContent.replace(/^["']|["']$/g, '').trim()
        }
      } else {
        enhancedPrompt = cleanContent.replace(/^["']|["']$/g, '').trim()
      }
    } catch (llmErr) {
      console.warn('Qwen prompt expansion fallback:', llmErr?.message)
      enhancedPrompt = `Ultra-high-resolution photograph of ${cleanedPrompt}, complete subject fully in frame, 8k resolution, crisp clean details, natural studio lighting`
    }

    let officialPhotoUrl = null
    if (realPersonName && !isNanoBanana && !isAnime) {
      officialPhotoUrl = await findOfficialPhoto(realPersonName)
    }

    const seed = Math.floor(Math.random() * 9999999)
    const directImageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
      enhancedPrompt
    )}?model=${selectedModel}&width=1024&height=1024&seed=${seed}&nologo=true&enhance=true`

    let finalImageUrl = officialPhotoUrl || directImageUrl

    if (process.env.AWS_BUCKET_NAME) {
      try {
        const imageRes = await axios.get(directImageUrl, { responseType: 'arraybuffer', timeout: 20000 })
        const buffer = Buffer.from(imageRes.data)
        const filename = `image-${Date.now()}-${seed}.png`
        await uploadToS3(filename, buffer, 'image/png')
        finalImageUrl = await getFromS3(filename, 60 * 24 * 7)
      } catch (s3Err) {
        console.warn('S3 upload fallback to direct URL:', s3Err?.message)
        finalImageUrl = directImageUrl
      }
    }

    if (state.userId) {
      try {
        await deductCredits(state.userId, 'vision')
      } catch (creditErr) {
        console.warn('Credit deduction skipped:', creditErr?.message)
      }
    }

    return {
      ...state,
      images: [finalImageUrl],
      aiResponse: ``
    }
  } catch (error) {
    console.error('Vision agent error:', error)
    return {
      ...state,
      aiResponse: error?.data?.message || error?.message || '❌ Failed to generate image. Please try again.'
    }
  }
}
