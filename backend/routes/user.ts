require('dotenv').config()

const express = require('express');
const jwt = require('jsonwebtoken');
const z = require("zod")
const prisma = require('@prisma/client');
const { PrismaClient } = prisma;
const prismaClient = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;
const router = express.Router();

const signUpSchema = z.object({
    name     : z.string(),
    email    : z.string().email(),
    password : z.string()
})

router.post('/signup', async (req:any, res:any) => {
    const { name, email, password } = req.body;
    const {success} = signUpSchema.safeParse({name, email, password})
    if(!success){
        res.json({
            error : "Incorrect Email"
        })
    }

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required.'});
    }

    try {
        const existingUser = await prismaClient.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already in use.' });
        }
        const newUser = await prismaClient.user.create({
            data: {
                name,
                email,
                password, 
            },
        });
        const token = jwt.sign({ userId: newUser.id },JWT_SECRET , { expiresIn: '72h' });

        res.status(201).json({ token, user: { id: newUser.id, email: newUser.email, name: newUser.name } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }
});

module.exports = router;
