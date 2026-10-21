import {securityHeaders} from '../src/lib/deployment';
export async function onRequest(context: {env:{ACCOUNTS_MODE?:string;SUPABASE_URL?:string};next():Promise<Response>}) {
  const response=await context.next();
  const secured=new Response(response.body,response);
  for(const [name,value] of Object.entries(securityHeaders(context.env.ACCOUNTS_MODE==='hosted'?context.env.SUPABASE_URL:null))) secured.headers.set(name,value);
  return secured;
}
