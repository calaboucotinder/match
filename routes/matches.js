const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// Obter todos os matches do usuário
router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('matches', 'name photo age gender pronoun orientation relationship bio interests');
        res.json(user.matches);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Verificar se há match com outro usuário
router.get('/check/:userId', auth, async (req, res) => {
    try {
        const otherUser = await User.findById(req.params.userId);
        if (!otherUser) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        const isMatch = req.user.matches.includes(req.params.userId);
        res.json({ isMatch });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Remover match
router.delete('/:userId', auth, async (req, res) => {
    try {
        req.user.matches = req.user.matches.filter(match => match.toString() !== req.params.userId);
        await req.user.save();

        const otherUser = await User.findById(req.params.userId);
        if (otherUser) {
            otherUser.matches = otherUser.matches.filter(match => match.toString() !== req.user._id.toString());
            await otherUser.save();
        }

        res.json({ message: 'Match removido com sucesso' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router; 