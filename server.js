const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Conectar ao MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    retryWrites: true,
    w: 'majority'
})
.then(() => {
    console.log('Conectado ao MongoDB Atlas com sucesso!');
})
.catch((error) => {
    console.error('Erro ao conectar ao MongoDB:', error.message);
});

// Armazenamento local para testes
const users = [];
const tokens = {};

// Rotas da API
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/photos', require('./routes/photos'));
app.use('/api/matches', require('./routes/matches'));

// Servir arquivos estáticos
app.use(express.static(__dirname));

// Rota principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Rotas de autenticação
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password, age, gender, pronoun, orientation, bio } = req.body;
        
        // Verificar se o usuário já existe
        if (users.find(u => u.email === email)) {
            return res.status(400).json({ error: 'Email já cadastrado' });
        }
        
        // Criar novo usuário
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = {
            id: users.length + 1,
            name,
            email,
            password: hashedPassword,
            age: parseInt(age),
            gender,
            pronoun,
            orientation,
            bio,
            photo: 'https://i.pravatar.cc/300?img=' + (users.length + 1),
            createdAt: new Date()
        };
        
        users.push(user);
        
        // Gerar token
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'calabouco-secret-key-2024');
        tokens[token] = user.id;
        
        res.status(201).json({ user, token });
    } catch (error) {
        console.error('Erro no registro:', error);
        res.status(500).json({ error: 'Erro ao criar conta' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Encontrar usuário
        const user = users.find(u => u.email === email);
        if (!user) {
            return res.status(400).json({ error: 'Email ou senha incorretos' });
        }
        
        // Verificar senha
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Email ou senha incorretos' });
        }
        
        // Gerar token
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'calabouco-secret-key-2024');
        tokens[token] = user.id;
        
        res.json({ user, token });
    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ error: 'Erro ao fazer login' });
    }
});

// Middleware de autenticação
const auth = (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '');
        const userId = tokens[token];
        
        if (!userId) {
            throw new Error();
        }
        
        req.user = users.find(u => u.id === userId);
        req.token = token;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Por favor, faça login.' });
    }
};

// Rota para obter perfil do usuário
app.get('/users/profile', auth, (req, res) => {
    res.json(req.user);
});

// Tratamento de erros
app.use((err, req, res, next) => {
    console.error('Erro:', err.stack);
    res.status(500).json({ error: 'Algo deu errado!', details: err.message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log('Diretório atual:', __dirname);
}); 