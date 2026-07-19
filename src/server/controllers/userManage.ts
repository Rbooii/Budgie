import { Context } from "hono";
import { AppEnv } from "../middleware/auth";
import { updatePlusfunc, UserPlusStatus } from "../services/userManage";
import { UpdatePlus } from "../schemas/userManage";


type ValidatedContext<T> = Context<AppEnv, string, { out: { json: T } }>;

export async function getStatus(c: Context<AppEnv>){
    const user = c.get("user");
    const status = await UserPlusStatus(user.id);
    if(status === undefined) return c.json({error: "Status Unavailable"}, 400);
    return c.json(status);
}

export async function update(c: ValidatedContext<UpdatePlus>){
    const user = c.get("user");
    const body = c.req.valid("json");
    try {
        const updated = await updatePlusfunc(user.id, body);
        return c.json(updated);
    } catch (error) {
        return c.json({ error: "Not found" }, 404);
    }
}