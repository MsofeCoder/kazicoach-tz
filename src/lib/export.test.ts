import {describe,expect,it} from 'vitest';
import {collectPages} from './export';
describe('account export pagination',()=>{
  it('exports every record across more than two full pages',async()=>{
    const rows=Array.from({length:1207},(_,id)=>({id}));const offsets:number[]=[];
    const result=await collectPages(async(offset,size)=>{offsets.push(offset);return rows.slice(offset,offset+size);},()=>true);
    expect(result).toEqual(rows);expect(offsets).toEqual([0,500,1000]);
  });
  it('fails rather than downloading partial data or a switched account',async()=>{
    let current=true;
    await expect(collectPages(async()=>{current=false;return [{id:'private'}];},()=>current)).rejects.toThrow(/Account changed/);
    await expect(collectPages(async()=>{throw new Error('Connection failed');},()=>true)).rejects.toThrow(/Connection/);
  });
});
