import { Hono } from "hono";
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import {verify} from 'hono/jwt';
export const blogRouter = new Hono<{
	Bindings: {
		DATABASE_URL: string
        JWT_SECRET: string
	},
    Variables:{
        userId : string
    }
    
}>();

blogRouter.use('/*', async (c, next) => {
	const jwt = c.req.header('Authorization');
	if (!jwt) {
		c.status(401);
		return c.json({ error: "unauthorized" });
	}
	const token = jwt;
	const payload = await verify(token, c.env.JWT_SECRET);
	if (!payload) {
		c.status(401);
		return c.json({ error: "unauthorized" });
	}
	c.set('userId', String(payload.id));
	await next()
})
blogRouter.post('/p', async (c) => {

    const userId=c.get('userId');
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());
    const body=await c.req.json()
    
    const post=await prisma.post.create({
        data:{
            title: body.title,
            content : body.content,
            authorid : userId
        }
    });

    return c.json({
        id : post.id
    })
})
  
blogRouter.put('/p', async(c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());
    const body=await c.req.json()
    const userId=c.get("userId")
    const post=await prisma.post.update({
        where: {
            id: body.id,
        },
        data: {
			title: body.title,
			content: body.content
		}
    });

    return c.text("blog updated")
})


blogRouter.get('/bulk', async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());
    const posts=await prisma.post.findMany()

    return c.json(posts)
})
blogRouter.get('/:id', async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    const id=c.req.param('id');
    const post=await prisma.post.findUnique({
        where:{
            id
        }
    });
    return c.json(post)
})

