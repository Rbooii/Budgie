import { prisma } from "@/lib/prisma";
import { UpdatePlus } from "../schemas/userManage";

export async function UserPlusStatus(userId:string){
    const user = await prisma.user.findUnique({
        where: { id : userId}
    })
    return user?.plus;
}

export async function updatePlusfunc(userId:string, input:UpdatePlus){
    return prisma.user.update({
        where : {id : userId},
        data : {
            plus : input.plus
        }
    })
}