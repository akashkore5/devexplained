import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  const { lang, id } = req.query;

  // Validate query parameters
  if (!lang || !id) {
    return res.status(400).json({ message: 'Missing required query parameters: lang, id' });
  }

  const validLangs = ['java', 'cpp', 'python'];
  if (!validLangs.includes(lang.toLowerCase())) {
    return res.status(400).json({ message: `Invalid language. Supported languages: ${validLangs.join(', ')}` });
  }

  try {
    const filePath = path.join(process.cwd(), 'data', `${lang.toLowerCase()}main.json`);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ 
        message: `Main code file not found for language: ${lang}`,
        filePath: filePath // Include for debugging in development
      });
    }

    // Read and parse JSON file
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    let mainCodes;
    try {
      mainCodes = JSON.parse(fileContent);
    } catch (parseError) {
      console.error(`Error parsing JSON file ${filePath}:`, parseError);
      return res.status(500).json({ message: 'Invalid JSON format in main code file' });
    }

    // Check if code exists for the given ID
    const code = mainCodes[id];
    if (!code) {
      return res.status(404).json({ 
        message: `Main code not found for problem ID: ${id} in ${lang}`,
        availableIds: Object.keys(mainCodes) // Helpful for debugging
      });
    }

    return res.status(200).json({ code });
  } catch (error) {
    console.error(`Error fetching main code for lang=${lang}, id=${id}:`, error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}