import { AISuggestion } from '../types';

export async function suggestOrganization(params: {
  resourceName: string;
  resourceType: string;
  textSnippet?: string;
  existingFolders?: string[];
  existingTags?: string[];
}): Promise<AISuggestion | null> {
  try {
    const res = await fetch('/api/gemini/suggest-organization', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (data.success && data.suggestions) {
      return data.suggestions;
    }
    return null;
  } catch (err) {
    console.error('Failed to get AI organization suggestions:', err);
    return null;
  }
}

export async function summarizePdf(params: {
  pdfBase64?: string;
  textContent?: string;
  fileName?: string;
}): Promise<string> {
  try {
    let cleanB64 = params.pdfBase64;
    if (cleanB64 && cleanB64.includes(',')) {
      cleanB64 = cleanB64.split(',')[1];
    }
    // Limit huge base64 payload to ~12MB string to prevent json buffer overflows
    if (cleanB64 && cleanB64.length > 15000000) {
      cleanB64 = undefined;
    }

    const res = await fetch('/api/gemini/summarize-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pdfBase64: cleanB64,
        textContent: params.textContent,
        fileName: params.fileName,
      }),
    });

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const text = await res.text();
      console.error('Non-JSON response from summarize-pdf:', text.slice(0, 150));
      throw new Error(`Server endpoint returned error (${res.status}).`);
    }

    const data = await res.json();
    if (data.success && data.summary) {
      return data.summary;
    }
    throw new Error(data.error || 'Failed to generate summary');
  } catch (err: any) {
    console.error('Failed to summarize PDF:', err);
    throw err;
  }
}

export async function askPdfQuestion(params: {
  question: string;
  pdfBase64?: string;
  textContent?: string;
  fileName?: string;
  history?: { role: 'user' | 'model'; text: string }[];
}): Promise<string> {
  try {
    let cleanB64 = params.pdfBase64;
    if (cleanB64 && cleanB64.includes(',')) {
      cleanB64 = cleanB64.split(',')[1];
    }
    if (cleanB64 && cleanB64.length > 15000000) {
      cleanB64 = undefined;
    }

    const res = await fetch('/api/gemini/qa-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: params.question,
        pdfBase64: cleanB64,
        textContent: params.textContent,
        fileName: params.fileName,
        history: params.history,
      }),
    });

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const text = await res.text();
      console.error('Non-JSON response from qa-pdf:', text.slice(0, 150));
      throw new Error(`Server endpoint returned error (${res.status}).`);
    }

    const data = await res.json();
    if (data.success && data.answer) {
      return data.answer;
    }
    throw new Error(data.error || 'Failed to get answer');
  } catch (err: any) {
    console.error('Failed to ask question about PDF:', err);
    throw err;
  }
}
