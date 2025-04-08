# 🧛‍♂️ Calabouço Dating

Um aplicativo de encontros com tema gótico/vampiro.

## 🚀 Funcionalidades

- Sistema de login e registro
- Perfil personalizado com fotos
- Sistema de matches
- Chat em tempo real
- Suporte a mídia (fotos e vídeos)
- Interface responsiva
- Modo PWA (Progressive Web App)

## 🛠️ Tecnologias

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js, Express
- Banco de Dados: MongoDB
- Autenticação: JWT
- Upload de arquivos: Multer

## 📱 Como usar

1. Acesse o site
2. Crie uma conta ou faça login
3. Complete seu perfil
4. Comece a encontrar matches!

## 🔒 Segurança

- Senhas criptografadas
- Autenticação JWT
- Proteção contra CSRF
- Validação de dados

## 🌐 Deploy

O aplicativo está disponível em: [https://calabouco-tinder.onrender.com](https://calabouco-tinder.onrender.com)

## Requisitos

- Node.js (versão 14 ou superior)
- MongoDB (versão 4.4 ou superior)
- PowerShell 7 ou superior

## Instalação

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/calabouco-tinder.git
cd calabouco-tinder
```

2. Instale o Node.js:
- Baixe e instale o Node.js em https://nodejs.org/

3. Instale o MongoDB:
- Baixe e instale o MongoDB em https://www.mongodb.com/try/download/community
- Crie um diretório para os dados: `mkdir C:\data\db`

4. Execute o script de inicialização:
```powershell
.\start.ps1
```

O script irá:
- Verificar se o Node.js e MongoDB estão instalados
- Criar os diretórios necessários
- Instalar as dependências
- Iniciar o MongoDB
- Iniciar o servidor

## Estrutura do Projeto

```
calabouco-tinder/
├── models/              # Modelos do MongoDB
├── routes/              # Rotas da API
├── middleware/          # Middlewares
├── public/             # Arquivos estáticos
│   ├── uploads/        # Uploads de fotos e mídia
│   ├── index.html      # Página principal
│   ├── styles.css      # Estilos
│   └── app.js          # Cliente JavaScript
├── server.js           # Servidor Express
├── package.json        # Dependências
└── .env               # Variáveis de ambiente
```

## API Endpoints

### Autenticação
- POST /api/auth/register - Registrar novo usuário
- POST /api/auth/login - Login
- POST /api/auth/logout - Logout

### Usuários
- GET /api/users/profile - Obter perfil
- PATCH /api/users/profile - Atualizar perfil
- GET /api/users/swipe - Obter usuários para swipe
- POST /api/users/like/:userId - Curtir usuário
- POST /api/users/dislike/:userId - Não curtir usuário
- GET /api/users/matches - Obter matches

### Mensagens
- POST /api/messages/send/:userId - Enviar mensagem
- GET /api/messages/conversations - Obter conversas
- GET /api/messages/chat/:userId - Obter chat com usuário
- PATCH /api/messages/read/:userId - Marcar mensagens como lidas
- POST /api/messages/react/:messageId - Reagir a mensagem

### Fotos
- POST /api/photos/upload - Upload de foto
- GET /api/photos/user/:userId - Obter fotos do usuário
- POST /api/photos/request-access/:userId - Solicitar acesso a fotos privadas
- GET /api/photos/access-requests - Obter solicitações de acesso
- PATCH /api/photos/access-requests/:requestId - Responder solicitação
- DELETE /api/photos/:photoId - Remover foto

## Recursos

- Sistema de matches
- Chat em tempo real
- Fotos públicas e privadas
- Solicitações de acesso a fotos privadas
- Reações a mensagens
- Upload de fotos e mídia
- Análise de perfil e estatísticas

## Segurança

- Autenticação JWT
- Senhas criptografadas
- Validação de uploads
- Controle de acesso a fotos privadas
- Proteção contra CSRF

## Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Crie um Pull Request

## Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo LICENSE para detalhes. 