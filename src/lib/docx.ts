import { unzipSync } from 'fflate';

const WORD = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const PARTS = ['word/document.xml', 'word/footnotes.xml', 'word/endnotes.xml'];
const MAX_XML = 4 * 1024 * 1024;

// Text only: never render imported HTML, follow relationships or load external resources.
export function extractDocxText(bytes: Uint8Array): string {
  if (bytes.length > 8 * 1024 * 1024) throw new Error('DOCX exceeds the 8 MB limit.');
  let count = 0, expanded = 0;
  const seen = new Set<string>();
  const parts = unzipSync(bytes, { filter(entry) {
    if (++count > 2000) throw new Error('DOCX has too many archive entries.');
    if (!PARTS.includes(entry.name)) return false;
    if (seen.has(entry.name)) throw new Error('DOCX has duplicate text parts.');
    seen.add(entry.name);
    expanded += entry.originalSize;
    if (expanded > MAX_XML || entry.originalSize > MAX_XML) throw new Error('DOCX text exceeds the extraction limit.');
    return true;
  }});
  if (!parts[PARTS[0]]) throw new Error('No document text found in this DOCX.');
  const output: string[] = [];
  for (const name of PARTS) {
    if (!parts[name]) continue;
    const xml = new TextDecoder('utf-8', {fatal:true}).decode(parts[name]);
    if (/<!DOCTYPE|<!ENTITY/i.test(xml)) throw new Error('Unsupported XML declaration in DOCX.');
    const doc = new DOMParser().parseFromString(xml, 'application/xml');
    if (doc.getElementsByTagName('parsererror').length) throw new Error('Invalid DOCX XML.');
    const stack: {node: Node; depth: number}[] = [{node:doc.documentElement, depth:0}];
    let visited = 0;
    while (stack.length) {
      const {node,depth} = stack.pop()!;
      if (++visited > 100000 || depth > 128) throw new Error('DOCX text structure is too complex.');
      const element = node as Element;
      if (element.namespaceURI === WORD) {
        if (element.localName === 'del') continue;
        if (element.localName === 't') { output.push(element.textContent || ''); continue; }
        if (['p','br','cr'].includes(element.localName)) output.push('\n');
        if (element.localName === 'tab') output.push('\t');
      }
      for (let i = node.childNodes.length - 1; i >= 0; i--) stack.push({node:node.childNodes[i],depth:depth+1});
    }
    output.push('\n');
  }
  return output.join('').trim();
}
