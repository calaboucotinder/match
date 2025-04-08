const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/User');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Configuração do Multer para upload de arquivos
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'public/uploads/');
    },
    filename: function(req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Enviar mensagem
router.post('/send/:userId', auth, upload.array('media', 5), async (req, res) => {
    try {
        const receiver = await User.findById(req.params.userId);
        if (!receiver) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        const message = new Message({
            sender: req.user._id,
            receiver: receiver._id,
            content: req.body.content,
            media: req.files ? req.files.map(file => ({
                type: file.mimetype.startsWith('image/') ? 'image' : 'video',
                url: `/uploads/${file.filename}`
            })) : []
        });

        await message.save();
        res.status(201).json(message);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Obter conversas
router.get('/conversations', auth, async (req, res) => {
    try {
        const conversations = await Message.aggregate([
            {
                $match: {
                    $or: [
                        { sender: req.user._id },
                        { receiver: req.user._id }
                    ]
                }
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $group: {
                    _id: {
                        $cond: [
                            { $eq: ['$sender', req.user._id] },
                            '$receiver',
                            '$sender'
                        ]
                    },
                    lastMessage: { $first: '$$ROOT' }
                }
            }
        ]);

        await Message.populate(conversations, {
            path: '_id',
            select: 'name photo'
        });

        res.json(conversations);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Obter mensagens com um usuário específico
router.get('/chat/:userId', auth, async (req, res) => {
    try {
        const messages = await Message.find({
            $or: [
                { sender: req.user._id, receiver: req.params.userId },
                { sender: req.params.userId, receiver: req.user._id }
            ]
        }).sort({ createdAt: 1 });

        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Marcar mensagens como lidas
router.patch('/read/:userId', auth, async (req, res) => {
    try {
        await Message.updateMany(
            {
                sender: req.params.userId,
                receiver: req.user._id,
                read: false
            },
            { read: true }
        );

        res.json({ message: 'Mensagens marcadas como lidas' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Adicionar reação a uma mensagem
router.post('/react/:messageId', auth, async (req, res) => {
    try {
        const message = await Message.findById(req.params.messageId);
        if (!message) {
            return res.status(404).json({ error: 'Mensagem não encontrada' });
        }

        const reaction = {
            user: req.user._id,
            type: req.body.type
        };

        message.reactions.push(reaction);
        await message.save();
        res.json(message);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router; 