import prisma from '../../config/db.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import cloudinary from '../../config/cloudinary.js';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const generateImage = async (req, res) => {
  try {
    const { prompt, style, aspectRatio, format, generationType = 'single', numSlides = 1 } = req.body;
    const userId = req.user.id;

    if (!prompt) {
      return res.status(400).json({ message: 'Prompt is required' });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    let styleInstruction = `Style: ${style}.`;
    if (style === 'Ad Creative') {
      styleInstruction = `Style: High-conversion professional advertisement creative. 
      Focus on: 
      - Clean, modern, and eye-catching composition.
      - Vibrant but professional color palette.
      - Premium product photography look.
      - Clear negative space for potential text overlays.
      - Emotional appeal and professional lighting.
      - High-end commercial aesthetic suitable for social media marketing (Instagram, Facebook Ads).
      Avoid: cluttered backgrounds, low quality, or amateur look.`;
    }

    const finalNumSlides = generationType === 'carousel' ? Math.min(Math.max(parseInt(numSlides), 2), 10) : 1;
    const groupId = generationType === 'carousel' ? `carousel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` : null;

    let slidePrompts = [];

    if (generationType === 'carousel') {
      const carouselPrompt = `You are a creative ad strategist. Based on this prompt: "${prompt}", generate ${finalNumSlides} cohesive slide descriptions for a carousel ad. 
      Each slide should follow a story: 
      Slide 1: Hook/Introduction.
      Slide 2-${finalNumSlides - 1}: Value Propositions/Features.
      Slide ${finalNumSlides}: Call to Action.
      Return ONLY a JSON array of strings, where each string is the enhanced prompt for that specific slide. Include the ${styleInstruction}`;

      const result = await model.generateContent(carouselPrompt);
      const response = await result.response;
      const text = response.text();
      
      try {
        // Extract JSON array from the response (in case there's markdown or extra text)
        const jsonMatch = text.match(/\[.*\]/s);
        if (jsonMatch) {
          slidePrompts = JSON.parse(jsonMatch[0]);
        } else {
          slidePrompts = new Array(finalNumSlides).fill(prompt);
        }
      } catch (e) {
        console.error('Error parsing carousel prompts:', e);
        slidePrompts = new Array(finalNumSlides).fill(prompt);
      }
    } else {
      slidePrompts = [`${prompt}. ${styleInstruction} Aspect Ratio: ${aspectRatio}.`];
    }

    const generatedImages = [];

    // Helper to get dimensions from aspect ratio string
    const getDimensions = (ratio) => {
      switch (ratio) {
        case '16:9': return { w: 1280, h: 720 };
        case '9:16': return { w: 720, h: 1280 };
        case '3:4': return { w: 768, h: 1024 };
        case '4:3': return { w: 1024, h: 768 };
        case '21:9': return { w: 1536, h: 640 };
        case '1:1': 
        default: return { w: 1024, h: 1024 };
      }
    };

    const { w, h } = getDimensions(aspectRatio);

    for (let i = 0; i < slidePrompts.length; i++) {
      const currentSlidePrompt = slidePrompts[i];
      
      // Generate a dynamic image URL based on the prompt using Pollinations.ai
      const seed = Math.floor(Math.random() * 1000000);
      const encodedPrompt = encodeURIComponent(currentSlidePrompt);
      const dynamicImageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${w}&height=${h}&seed=${seed}&nologo=true&enhance=true`;

      // Upload the dynamically generated image to Cloudinary for permanent storage
      const uploadResponse = await cloudinary.uploader.upload(dynamicImageUrl, {
        folder: 'gemini-images',
        public_id: `image_${Date.now()}_${i}`,
        resource_type: 'auto'
      });

      // Save image to database
      const savedImage = await prisma.image.create({
        data: {
          url: uploadResponse.secure_url,
          prompt: currentSlidePrompt,
          style: style,
          aspectRatio: aspectRatio,
          format: format,
          groupId: groupId,
          userId: userId
        }
      });

      generatedImages.push({
        id: savedImage.id,
        url: savedImage.url,
        prompt: savedImage.prompt
      });
    }

    res.status(200).json({ 
      message: generationType === 'carousel' ? 'Carousel generated successfully' : 'Image generated successfully',
      images: generatedImages,
      groupId: groupId
    });

  } catch (error) {
    console.error('Image Generation Error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getImages = async (req, res) => {
  try {
    const images = await prisma.image.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    res.status(200).json(images);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
