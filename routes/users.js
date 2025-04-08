const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// Obter perfil do usuário
router.get('/profile', auth, async (req, res) => {
    try {
        res.json(req.user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Atualizar perfil
router.patch('/profile', auth, async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['name', 'age', 'gender', 'pronoun', 'orientation', 'relationship', 'bio', 'additionalInfo', 'interests'];
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));

    if (!isValidOperation) {
        return res.status(400).json({ error: 'Atualizações inválidas' });
    }

    try {
        updates.forEach(update => req.user[update] = req.body[update]);
        await req.user.save();
        res.json(req.user);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Obter usuários para swipe
router.get('/swipe', auth, async (req, res) => {
    try {
        const users = await User.find({
            _id: { $ne: req.user._id },
            _id: { $nin: [...req.user.likes, ...req.user.dislikes] }
        }).limit(10);
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Like em um usuário
router.post('/like/:userId', auth, async (req, res) => {
    try {
        const likedUser = await User.findById(req.params.userId);
        if (!likedUser) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        req.user.likes.push(likedUser._id);
        await req.user.save();

        // Verificar match
        if (likedUser.likes.includes(req.user._id)) {
            req.user.matches.push(likedUser._id);
            likedUser.matches.push(req.user._id);
            await Promise.all([req.user.save(), likedUser.save()]);
            return res.json({ match: true, user: likedUser });
        }

        res.json({ match: false });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Dislike em um usuário
router.post('/dislike/:userId', auth, async (req, res) => {
    try {
        const dislikedUser = await User.findById(req.params.userId);
        if (!dislikedUser) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        req.user.dislikes.push(dislikedUser._id);
        await req.user.save();
        res.json({ message: 'Dislike registrado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Obter matches
router.get('/matches', auth, async (req, res) => {
    try {
        await req.user.populate('matches');
        res.json(req.user.matches);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router; 