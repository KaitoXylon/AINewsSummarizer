const OPENROUTER_API_KEY = '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';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function retryWithBackoff(fn: () => Promise<any>, maxRetries = 3, initialDelay = 1000): Promise<any> {
  let retries = 0;

  while (retries < maxRetries) {
    try {
      return await fn();
    } catch (error: any) {
      if (error?.status === 429 || (error?.error?.code === 429)) {
        retries++;
        if (retries === maxRetries) throw error;

        const waitTime = initialDelay * Math.pow(2, retries - 1);
        console.log(`Rate limited. Retrying in ${waitTime}ms...`);
        await delay(waitTime);
        continue;
      }
      throw error;
    }
  }
}

function extractJsonFromString(str: string): any {
  const jsonStart = str.indexOf('{');
  const jsonEnd = str.lastIndexOf('}');
  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error('No JSON object found in the string.');
  }
  const jsonString = str.substring(jsonStart, jsonEnd + 1);
  return JSON.parse(jsonString);
}

export async function fetchNewsFromAI(): Promise<AIResponse> {

  // --- Get the current date dynamically ---
  const today = new Date();
  // Format the date as "Month Day, Year" (e.g., "April 19, 2025")
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
  const formattedDate = today.toLocaleDateString('en-US', options);
  // ----------------------------------------

  // Use template literals for the prompt to inject the dynamic date
  const prompt = `You are a JSON-generating API. Your task is to crawl and extract news articles, then return them in a specific JSON format.

CRITICAL: You must ONLY return a valid JSON object matching this exact structure:
{
  "news": [
    {
      "title": "News headline here",
      "summary": "A short summary of the article.",
      "image": "Direct image link related to the article",
      "link": "Original article URL"
    }
  ]
}

DO NOT include any extra words, explanations, or markdown like \`\`\`json. Only return raw JSON — starting with { and ending with }.
DO NOT get old news, no news before 2025

search today's news
Sources to crawl:
- https://www.dhakatribune.com/
- https://thedailystar.net/
- https://www.aljazeera.com/

Focus on:
- search the websites, get news published **today, ${formattedDate}** <-- Date injected here
- Strictly include only articles with a publication date from **today, ${formattedDate}**. <-- Date injected here
- dont get old news, do not include any news published before today.
- Trending topics in Bangladesh
- Palestine news
- Trump news

Requirements:
1. Return 5-10 most relevant articles *from today*. If fewer than 5 articles from today match criteria, return all articles found from today (min 1, max 10)
2. If any content is in Bangla, translate to English
3. For each article:
   
   - Include the exact headline as title
   - Create a concise summary of 5 sentences, include the date of the article ,Include the article link
   - Include the direct article link
   - inclue a image that represents the article. find keywords and search images (you can search from pexels.com, pinterest.com, facebook.com, google.com)
   

Remember: Return ONLY the JSON object with no additional text. **Ensure all news items are published today, ${formattedDate}**.`; // Also add the dynamic date here for emphasis

  return retryWithBackoff(async () => {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'News Summarizer',
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-3.3-70b-instruct',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: prompt // Use the dynamically generated prompt
                }
              ]
            }
          ],
          response_format: { type: "json_object" }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);

        if (response.status === 429) {
          const error = new Error('Rate limit exceeded');
          (error as any).status = 429;
          throw error;
        }

        throw new Error(`API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();

      if (!data.choices?.[0]?.message?.content) {
        console.error('Invalid API response structure:', data);
        throw new Error('Invalid API response structure');
      }

      let content: any;
      try {
        content = extractJsonFromString(data.choices[0].message.content);
      } catch (error) {
        console.error('Failed to extract JSON from response:', data.choices[0].message.content);
        throw new Error('Invalid JSON in API response');
      }

      if (!content || !Array.isArray(content.news)) {
        console.error('Invalid response format:', content);
        throw new Error('Invalid response format: missing news array');
      }

      content.news = content.news.filter((item: any) => {
        const isValid =
          typeof item.title === 'string' &&
          typeof item.summary === 'string' &&
          typeof item.link === 'string' &&
          typeof item.image === 'string';

        if (!isValid) {
          console.warn('Filtered out invalid news item:', item);
        }

        return isValid;
      });

      if (content.news.length === 0) {
        throw new Error('No valid news items in response');
      }

      return content as AIResponse;
    } catch (error) {
      console.error('Error in API call:', error);
      throw error;
    }
  });
}

// Define AIResponse type if it's not already defined elsewhere
// interface AIResponse {
//   news: {
//     title: string;
//     summary: string;
//     image: string;
//     link: string;
//   }[];
// }