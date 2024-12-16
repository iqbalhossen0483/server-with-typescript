import { HarmBlockThreshold, HarmCategory, VertexAI } from '@google-cloud/vertexai';
import path from 'path';
import config from '../../config/config';

// Initialize Vertex with your Cloud project and location
const vertexAi = new VertexAI({ project: config.vertext.vertext_ai_project, location: config.vertext.vertext_location });
const model = config.vertext.vertext_model;

// Instantiate the models
// eslint-disable-next-line import/prefer-default-export
export const generativeModel = vertexAi.preview.getGenerativeModel({
  model,
  generationConfig: {
    maxOutputTokens: 8192,
    temperature: 1,
    topP: 0.95,
  },
  safetySettings: [
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.HARM_BLOCK_THRESHOLD_UNSPECIFIED,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.HARM_BLOCK_THRESHOLD_UNSPECIFIED,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.HARM_BLOCK_THRESHOLD_UNSPECIFIED,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.HARM_BLOCK_THRESHOLD_UNSPECIFIED,
    },
  ],
});

type Doc = {
  fileData: {
    mimeType: string;
    fileUri: string;
  };
}[];
export const aiChatModelStream = async (documentParts: Doc, message?: string) => {
  process.env['GOOGLE_APPLICATION_CREDENTIALS'] = path.join(__dirname, '..', '..', '..', 'service_account.json');

  // Create AI chat instance
  const aiChat = generativeModel.startChat({});

  let question = '';
  const promt = 'Provide the response in HTML format give me just body tag,';
  if (message) {
    question = promt + message;
  } else {
    question = `${promt} listing the features clearly.`;
  }

  // Get AI response
  const streamResult = await aiChat.sendMessageStream([...documentParts, { text: question }]);

  let responseData = '';

  for await (const item of streamResult.stream) {
    const parsedResponse = JSON.parse(JSON.stringify(item));

    for (const content of parsedResponse.candidates) {
      for (const parts of content.content.parts) {
        const { text } = parts;
        responseData += text;
      }
    }
  }
  return responseData;
};
