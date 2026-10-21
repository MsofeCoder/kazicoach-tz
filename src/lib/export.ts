export async function collectPages<T>(fetchPage:(offset:number,size:number)=>Promise<T[]>,stillCurrent:()=>boolean,pageSize=500):Promise<T[]> {
  const all:T[]=[];
  for(let offset=0;;offset+=pageSize) {
    if(!stillCurrent())throw new Error('Account changed during export');
    const rows=await fetchPage(offset,pageSize);
    if(!stillCurrent())throw new Error('Account changed during export');
    all.push(...rows);
    if(rows.length<pageSize)return all;
  }
}
