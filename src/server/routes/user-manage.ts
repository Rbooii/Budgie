import { Hono } from "hono";
import { AppEnv, requireAuth } from "../middleware/auth";
import * as controller from "@/server/controllers/userManage"
import { zValidator } from "@hono/zod-validator";
import { UpdatePlusSchema } from "../schemas/userManage";

export const user_manage = new Hono<AppEnv>()
    .use("*", requireAuth)
    .get("/", controller.getStatus)
    .patch(
        "/", 
        zValidator("json", UpdatePlusSchema),
        (c) => controller.update(c)
    )