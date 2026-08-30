import type { Material, OralQuestion, QuestionCategory } from '../types';

const MAX_FILE_SIZE = 8 * 1024 * 1024;
const MAX_TEXT = 100_000;

function materialKind(file: File): Material['kind'] {
  const name = file.name.toLowerCase();
  if (/cv|resume|curriculum/.test(name)) return 'cv';
  if (/job|advert|vacancy|description|jd/.test(name)) return 'job';
  if (/letter|application|cover/.test(name)) return 'letter';
  if (file.type.startsWith('image/')) return 'image';
  return 'notes';
}

export async function extractMaterial(file: File): Promise<Material> {
  if (file.size > MAX_FILE_SIZE) throw new Error('File is larger than the 8 MB MVP limit.');

  const lower = file.name.toLowerCase();
  const base = {
    id: crypto.randomUUID(),
    name: file.name,
    kind: materialKind(file),
    mime: file.type || 'application/octet-stream',
    size: file.size,
    addedAt: new Date().toISOString(),
  };

  if (file.type.startsWith('image/')) {
    return { ...base, kind: 'image', extractedText: '', status: 'reference-only' };
  }

  let extractedText = '';
  if (lower.endsWith('.txt') || lower.endsWith('.md') || file.type.startsWith('text/')) {
    extractedText = await file.text();
  } else if (lower.endsWith('.docx')) {
    const mammoth = await import('mammoth/mammoth.browser');
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    extractedText = result.value;
  } else if (lower.endsWith('.pdf')) {
    const pdfjs = await import('pdfjs-dist');
    const workerSrc = (await import('pdfjs-dist/build/pdf.worker.mjs?url')).default;
    pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
    const data = new Uint8Array(await file.arrayBuffer());
    const document = await pdfjs.getDocument({ data }).promise;
    const pages: string[] = [];
    for (let index = 1; index <= Math.min(document.numPages, 80); index += 1) {
      const page = await document.getPage(index);
      const content = await page.getTextContent();
      pages.push(content.items.map((item) => 'str' in item ? item.str : '').join(' '));
    }
    extractedText = pages.join('\n');
  } else {
    throw new Error('Use TXT, MD, PDF, DOCX, JPG, PNG, or WEBP files.');
  }

  extractedText = extractedText.replace(/\0/g, '').replace(/[ \t]+/g, ' ').trim().slice(0, MAX_TEXT);
  if (!extractedText) throw new Error('No selectable text was found in this file.');
  return { ...base, extractedText, status: 'ready' };
}

const stopWords = new Set('about after again against also because been before being between could from have into itself more most other over same should some such than that their there these they this those through under very what when where which while will with would your'.split(' '));

function titleFromSentence(sentence: string): string[] {
  const words = sentence
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 4 && !stopWords.has(word));
  const counts = new Map<string, number>();
  words.forEach(word => counts.set(word, (counts.get(word) || 0) + 1));
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([word]) => word);
}

export function createLocalQuestions(text: string, sourceName: string): OralQuestion[] {
  const clean = text.replace(/\s+/g, ' ').trim();
  const sentences = clean
    .split(/(?<=[.!?])\s+/)
    .map(value => value.trim())
    .filter(value => value.length >= 90 && value.length <= 600)
    .slice(0, 30);

  const selected: string[] = [];
  for (const sentence of sentences) {
    const terms = titleFromSentence(sentence);
    if (terms.length >= 2 && !selected.some(item => item.includes(terms[0]))) selected.push(sentence);
    if (selected.length >= 5) break;
  }

  return selected.map((sentence, index) => {
    const terms = titleFromSentence(sentence);
    const category: QuestionCategory = /ethic|integrity|corrupt|conflict/.test(sentence.toLowerCase())
      ? 'ethics'
      : /emergency|incident|scenario|violation/.test(sentence.toLowerCase())
        ? 'scenario'
        : 'technical';
    const topic = terms.slice(0, 3).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(', ');
    return {
      id: `local-${Date.now()}-${index}`,
      category,
      difficulty: 'Core',
      question: `How would you explain ${topic || 'this topic'} to an interview panel, and why is it relevant to the inspector role?`,
      swHint: 'Toa maana, umuhimu wake kwa kazi, mfano mmoja, na hatua ya inspector.',
      modelAnswer: sentence,
      keyPoints: terms.slice(0, 4).map(word => word.charAt(0).toUpperCase() + word.slice(1)),
      keywords: terms.slice(0, 4).map(word => [word]),
      timeLimit: 90,
      source: `Local extraction: ${sourceName}`,
      custom: true,
    };
  });
}
