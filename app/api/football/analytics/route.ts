import {getFootballAnalytics} from "@/lib/sports";

export async function GET(){
  try{
    const data=await getFootballAnalytics();
    return Response.json({ok:true,...data});
  }catch(error){
    return Response.json({ok:false,error:error instanceof Error?error.message:"Unknown error"},{status:500});
  }
}
