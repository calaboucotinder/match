const express = require('express');
const router = express.Router();
const User = require('../models/User');
const AccessRequest = require('../models/AccessRequest');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Configuração do Multer para upload de fotos
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'public/uploads/photos/');
    },
    filename: function(req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    },
    fileFilter: function(req, file, cb) {
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Apenas imagens são permitidas'));
        }
        cb(null, true);
    }
});

// Upload de foto
router.post('/upload', auth, upload.single('photo'), async (req, res) => {
    try {
        const photo = {
            url: `/uploads/photos/${req.file.filename}`,
            isPrivate: req.body.isPrivate === 'true',
            description: req.body.description
        };

        req.user.photos.push(photo);
        await req.user.save();
        res.status(201).json(photo);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Obter fotos do usuário
router.get('/user/:userId', auth, async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        // Se for o próprio usuário, retorna todas as fotos
        if (req.user._id.equals(user._id)) {
            return res.json(user.photos);
        }

        // Verifica se há match
        const hasMatch = user.matches.includes(req.user._id);
        
        // Retorna apenas fotos públicas se não houver match
        const photos = hasMatch ? user.photos : user.photos.filter(photo => !photo.isPrivate);
        res.json(photos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Solicitar acesso a fotos privadas
router.post('/request-access/:userId', auth, async (req, res) => {
    try {
        const request = new AccessRequest({
            from: req.user._id,
            to: req.params.userId,
            message: req.body.message
        });

        await request.save();
        res.status(201).json(request);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Obter solicitações de acesso pendentes
router.get('/access-requests', auth, async (req, res) => {
    try {
        const requests = await AccessRequest.find({
            to: req.user._id,
            status: 'pending'
        }).populate('from', 'name photo');
        res.json(requests);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Responder a uma solicitação de acesso
router.patch('/access-requests/:requestId', auth, async (req, res) => {
    try {
        const request = await AccessRequest.findOne({
            _id: req.params.requestId,
            to: req.user._id
        });

        if (!request) {
            return res.status(404).json({ error: 'Solicitação não encontrada' });
        }

        request.status = req.body.status;
        await request.save();
        res.json(request);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Remover foto
router.delete('/:photoId', auth, async (req, res) => {
    try {
        req.user.photos = req.user.photos.filter(photo => photo._id.toString() !== req.params.photoId);
        await req.user.save();
        res.json({ message: 'Foto removida com sucesso' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router; 