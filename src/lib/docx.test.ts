import {afterEach,describe,expect,it,vi} from 'vitest';
import {zipSync,strToU8} from 'fflate';
import {DOMParser} from '@xmldom/xmldom';
import {extractDocxText} from './docx';
const wrap=(body:string)=>`<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}</w:body></w:document>`;
describe('private DOCX text extraction',()=>{
  afterEach(()=>vi.unstubAllGlobals());
  it('extracts paragraphs, Unicode, split runs, tables, breaks and notes without exposing links or deleted text',()=>{
    vi.stubGlobal('DOMParser',DOMParser);
    const doc=zipSync({
      'word/document.xml':strToU8(wrap('<w:p><w:r><w:t>Habari &amp; welcome </w:t></w:r><w:r><w:t>世界</w:t></w:r></w:p><w:tbl><w:tr><w:tc><w:p><w:r><w:t>Safety</w:t><w:tab/><w:t>first</w:t><w:br/><w:t>Always</w:t></w:r></w:p></w:tc></w:tr></w:tbl><w:del><w:r><w:t>DELETED PRIVATE</w:t></w:r></w:del>')),
      'word/footnotes.xml':strToU8(wrap('<w:p><w:r><w:t>A note</w:t></w:r></w:p>')),
      'word/_rels/document.xml.rels':strToU8('https://private.invalid/secret'),
    });
    const result=extractDocxText(doc);
    expect(result).toContain('Habari & welcome 世界');expect(result).toContain('Safety\tfirst\nAlways');expect(result).toContain('A note');expect(result).not.toMatch(/DELETED|private.invalid/);
  });
  it('rejects oversized expanded text before decompression',()=>{
    const doc=zipSync({'word/document.xml':strToU8('x'.repeat(4*1024*1024+1))});
    expect(()=>extractDocxText(doc)).toThrow(/extraction limit/);
  });
  it('rejects DTDs, missing documents and deeply nested XML',()=>{
    vi.stubGlobal('DOMParser',DOMParser);
    expect(()=>extractDocxText(zipSync({'word/document.xml':strToU8('<!DOCTYPE x [<!ENTITY xx "secret">]>'+wrap(''))}))).toThrow(/declaration/);
    expect(()=>extractDocxText(zipSync({'other.txt':strToU8('text')}))).toThrow(/No document/);
    expect(()=>extractDocxText(zipSync({'word/document.xml':strToU8(wrap('<w:p>'.repeat(129)+'<w:t>text</w:t>'+'</w:p>'.repeat(129)))}))).toThrow(/complex/);
  });
});
