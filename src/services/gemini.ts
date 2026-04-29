import { GoogleGenAI, Type } from "@google/genai";
import { UserInfo, JobInfo } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generateCoverLetter(userInfo: UserInfo, jobInfo: JobInfo, templateStructure: string) {
  const prompt = `
    Generate a highly tailored cover letter for the following job application.
    
    USER INFORMATION:
    - Name: ${userInfo.fullName}
    - Email: ${userInfo.email}
    - Phone: ${userInfo.phone}
    - Location: ${userInfo.location}
    - Skills: ${userInfo.skills}
    - Experience: ${userInfo.experience}
    - Education: ${userInfo.education}
    
    JOB INFORMATION:
    - Title: ${jobInfo.jobTitle}
    - Company: ${jobInfo.companyName}
    - Description: ${jobInfo.jobDescription}
    - Industry: ${jobInfo.industry}
    - Culture: ${jobInfo.companyCulture}
    - Tone: ${jobInfo.tone}
    
    TEMPLATE STRUCTURE:
    ${templateStructure}
    
    INSTRUCTIONS:
    1. Write a professional, effective cover letter that highlights the user's relevant skills and experience for this specific job.
    2. Adapt the language and tone to match the specified "${jobInfo.tone}" style and the company culture: "${jobInfo.companyCulture}".
    3. Ensure the output is only the cover letter text, properly formatted with standard sections (Header at the top left, Date, Receiver Greeting, Opening, Body, Closing, Sign-off).
    4. MUST use double newlines (double spacing) between sections and paragraphs for a clean letter layout.
    5. Ensure the entire letter is left-aligned.
    6. Focus on value proposition: why the user is the best fit for this role.
    7. Return the response as a JSON object with the fields: 'content' (the letter text) and 'suggestions' (an array of 3-4 tips).
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            content: { type: Type.STRING },
            suggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["content", "suggestions"]
        }
      }
    });

    const data = JSON.parse(response.text || "{}");
    return data;
  } catch (error) {
    console.error("Error generating cover letter:", error);
    throw new Error("Failed to generate cover letter. Please try again.");
  }
}

export async function refineCoverLetter(currentContent: string, feedback: string) {
  const prompt = `
    Refine the following cover letter based on user feedback.
    
    CURRENT CONTENT:
    ${currentContent}
    
    USER FEEDBACK/REVISION REQUEST:
    ${feedback}
    
    INSTRUCTIONS:
    1. Update the letter to address the user's feedback precisely.
    2. Maintain a professional tone unless directed otherwise.
    3. Keep the overall structure but improve the specific parts requested.
    4. Return as JSON with 'content' and 'suggestions'.
  `;

  try {
     const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            content: { type: Type.STRING },
            suggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["content", "suggestions"]
        }
      }
    });

    const data = JSON.parse(response.text || "{}");
    return data;
  } catch (error) {
    console.error("Error refining cover letter:", error);
    throw new Error("Failed to refine cover letter.");
  }
}
