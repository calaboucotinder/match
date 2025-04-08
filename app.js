// Dados mockados para teste
const mockUsers = [
    {
        id: 1,
        name: "Zé do Calabouço",
        age: 25,
        photo: "https://i.pravatar.cc/300?img=1",
        pronoun: "ele/dele",
        bio: "Amo uma boa zoeira e cerveja gelada 🍺",
        additionalInfo: "Mestre em memes e piadas ruins"
    },
    {
        id: 2,
        name: "Maria da Noite",
        age: 23,
        photo: "https://i.pravatar.cc/300?img=2",
        pronoun: "ela/dela",
        bio: "Vampira de plantão 🧛‍♀️",
        additionalInfo: "Especialista em assustar pessoas"
    },
    {
        id: 3,
        name: "João das Sombras",
        age: 27,
        photo: "https://i.pravatar.cc/300?img=3",
        pronoun: "ele/dele",
        bio: "Guardião do calabouço 🏰",
        additionalInfo: "Colecionador de histórias assustadoras"
    }
];

// Estado do aplicativo
let currentUser = null;
let currentProfileIndex = 0;
let matches = [];
let chats = {};
let users = [];

// Estrutura de dados para o álbum de fotos
let photoAlbums = {
    profile: null,
    public: [],
    private: []
};

// Estrutura para solicitações de acesso
let accessRequests = {};

let currentPhotoIndex = 0;
let currentProfilePhotos = [];

// Cache de imagens
const imageCache = new Map();

// Variáveis globais para o chat
let currentChatUser = null;
let typingTimeout = null;
let mediaFile = null;

// Configurações de paginação
let currentPage = 1;
const messagesPerPage = 20;
let isLoadingMore = false;
let hasMoreMessages = true;

// Configuração de notificações
let pushSubscription = null;

// Configuração de gravação de áudio
let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;

// Elementos do chat
const chatScreen = document.getElementById('chatScreen');
const chatHeader = document.getElementById('chatHeader');
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendButton = document.getElementById('sendButton');
const mediaButton = document.getElementById('mediaButton');
const mediaInput = document.getElementById('mediaInput');
const mediaPreview = document.getElementById('mediaPreview');
const backButton = document.getElementById('backButton');
const typingIndicator = document.getElementById('typingIndicator');
const audioButton = document.querySelector('.chat-input button[data-action="audio"]');

let currentChat = null;
let mediaFiles = [];

// Função para carregar imagem com cache
async function loadImage(url) {
    if (imageCache.has(url)) {
        return imageCache.get(url);
    }

    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            imageCache.set(url, img);
            resolve(img);
        };
        img.onerror = reject;
        img.src = url;
    });
}

// Gestos de swipe
let touchStartX = 0;
let touchEndX = 0;

function handleTouchStart(e) {
    touchStartX = e.touches[0].clientX;
}

function handleTouchMove(e) {
    touchEndX = e.touches[0].clientX;
    const diff = touchStartX - touchEndX;
    const card = document.querySelector('.card');
    card.style.transform = `translateX(${-diff}px)`;
}

function handleTouchEnd() {
    const diff = touchStartX - touchEndX;
    const card = document.querySelector('.card');
    
    if (Math.abs(diff) > 100) {
        handleSwipe(diff > 0 ? 'left' : 'right');
    } else {
        card.style.transform = '';
    }
}

// Funções de navegação
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

function showSection(sectionName) {
    hideAllSections();
    document.getElementById(`${sectionName}-section`).classList.add('active');
    
    // Atualiza o menu ativo
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`.menu-item[onclick="showSection('${sectionName}')"]`).classList.add('active');
    
    // Atualiza o conteúdo da seção
    switch(sectionName) {
        case 'profile':
            updateProfileDisplay();
            break;
        case 'matches':
            updateMatchesSection();
            break;
        case 'chats':
            updateChatsSection();
            break;
        case 'swipe':
            loadNextProfile();
            break;
    }
}

function showRegister() {
    const loginScreen = document.getElementById('login-screen');
    const registerScreen = document.getElementById('register-screen');
    
    loginScreen.classList.remove('active');
    registerScreen.classList.add('active');
    
    // Limpa os campos do formulário de login
    document.getElementById('email').value = '';
    document.getElementById('password').value = '';
}

function showLogin() {
    const loginScreen = document.getElementById('login-screen');
    const registerScreen = document.getElementById('register-screen');
    
    registerScreen.classList.remove('active');
    loginScreen.classList.add('active');
    
    // Limpa os campos do formulário de registro
    document.getElementById('reg-name').value = '';
    document.getElementById('reg-email').value = '';
    document.getElementById('reg-age').value = '';
    document.getElementById('reg-password').value = '';
    document.getElementById('reg-confirm-password').value = '';
    document.getElementById('reg-photo').value = '';
}

// Função de registro
async function register() {
    const registerButton = document.querySelector('.register-form button');
    const originalText = registerButton.innerHTML;
    
    try {
        // Desabilita o botão e mostra loading
        registerButton.disabled = true;
        registerButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Criando conta...';
        
        const name = document.getElementById('reg-name').value;
        const email = document.getElementById('reg-email').value;
        const age = document.getElementById('reg-age').value;
        const gender = document.getElementById('reg-gender').value;
        const pronoun = document.getElementById('reg-pronoun').value;
        const orientation = document.getElementById('reg-orientation').value;
        const bio = document.getElementById('reg-bio').value;
        const password = document.getElementById('reg-password').value;
        const confirmPassword = document.getElementById('reg-confirm-password').value;
        const photoInput = document.getElementById('reg-photo');

        // Validações
        if (!name || !email || !age || !password || !confirmPassword) {
            throw new Error('Por favor, preencha todos os campos obrigatórios');
        }

        if (password !== confirmPassword) {
            throw new Error('As senhas não coincidem');
        }

        const formData = new FormData();
        formData.append('name', name);
        formData.append('email', email);
        formData.append('age', age);
        formData.append('gender', gender);
        formData.append('pronoun', pronoun);
        formData.append('orientation', orientation);
        formData.append('bio', bio);
        formData.append('password', password);
        
        if (photoInput.files.length > 0) {
            formData.append('photo', photoInput.files[0]);
        }

        const response = await fetch('/api/auth/register', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('token', data.token);
            
            // Mostra mensagem de sucesso
            registerButton.innerHTML = '<i class="fas fa-check"></i> Conta criada!';
            registerButton.style.backgroundColor = 'var(--success-color)';
            
            // Redireciona após 1 segundo
            setTimeout(() => {
                showScreen('main-screen');
                loadUserProfile();
            }, 1000);
        } else {
            const error = await response.json();
            throw new Error(error.message || 'Erro ao criar conta');
        }
    } catch (error) {
        console.error('Erro:', error);
        registerButton.innerHTML = '<i class="fas fa-exclamation-circle"></i> ' + error.message;
        registerButton.style.backgroundColor = 'var(--error-color)';
        
        // Restaura o botão após 3 segundos
        setTimeout(() => {
            registerButton.disabled = false;
            registerButton.innerHTML = originalText;
            registerButton.style.backgroundColor = '';
        }, 3000);
    }
}

// Função de login
async function login() {
    const loginButton = document.querySelector('.login-form button');
    const originalText = loginButton.innerHTML;
    
    try {
        // Desabilita o botão e mostra loading
        loginButton.disabled = true;
        loginButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Entrando...';
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        if (!email || !password) {
            throw new Error('Por favor, preencha todos os campos');
        }

        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('token', data.token);
            
            // Mostra mensagem de sucesso
            loginButton.innerHTML = '<i class="fas fa-check"></i> Entrando...';
            loginButton.style.backgroundColor = 'var(--success-color)';
            
            // Redireciona após 1 segundo
            setTimeout(() => {
                showScreen('main-screen');
                loadUserProfile();
            }, 1000);
        } else {
            const error = await response.json();
            throw new Error(error.message || 'Email ou senha incorretos');
        }
    } catch (error) {
        console.error('Erro:', error);
        loginButton.innerHTML = '<i class="fas fa-exclamation-circle"></i> ' + error.message;
        loginButton.style.backgroundColor = 'var(--error-color)';
        
        // Restaura o botão após 3 segundos
        setTimeout(() => {
            loginButton.disabled = false;
            loginButton.innerHTML = originalText;
            loginButton.style.backgroundColor = '';
        }, 3000);
    }
}

// Função para carregar o perfil do usuário
async function loadUserProfile() {
    try {
        const response = await fetch('/users/profile', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            const user = await response.json();
            updateProfileDisplay(user);
            loadMatches();
            loadChats();
        } else {
            showLogin();
        }
    } catch (error) {
        console.error('Erro:', error);
        showLogin();
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    showScreen('login-screen');
}

// Edição de Perfil
function editProfile() {
    // Preencher o formulário com os dados atuais do usuário
    document.getElementById('edit-name').value = currentUser.name || '';
    document.getElementById('edit-age').value = currentUser.age || '';
    document.getElementById('edit-gender').value = currentUser.gender || 'cis';
    document.getElementById('edit-pronoun').value = currentUser.pronoun || 'ele/dele';
    document.getElementById('edit-orientation').value = currentUser.orientation || 'heterossexual';
    document.getElementById('edit-relationship').value = currentUser.relationship || 'solteiro';
    document.getElementById('edit-bio').value = currentUser.bio || '';
    document.getElementById('edit-additional').value = currentUser.additionalInfo || '';
    
    // Mostrar a foto atual
    const profilePhoto = document.querySelector('#edit-profile-screen .profile-photo');
    profilePhoto.style.backgroundImage = `url(${currentUser.photo})`;
    
    // Mostrar a tela de edição
    showScreen('edit-profile-screen');
}

function backToProfile() {
    showScreen('main-screen');
    showSection('profile');
}

function saveProfile() {
    // Obter os valores do formulário
    const name = document.getElementById('edit-name').value;
    const age = document.getElementById('edit-age').value;
    const gender = document.getElementById('edit-gender').value;
    const pronoun = document.getElementById('edit-pronoun').value;
    const orientation = document.getElementById('edit-orientation').value;
    const relationship = document.getElementById('edit-relationship').value;
    const bio = document.getElementById('edit-bio').value;
    const additionalInfo = document.getElementById('edit-additional').value;
    const newPassword = document.getElementById('edit-password').value;
    const photoInput = document.getElementById('edit-photo');
    
    // Validar campos obrigatórios
    if (!name || !age) {
        alert('Por favor, preencha nome e idade!');
        return;
    }
    
    // Atualizar o usuário atual
    currentUser.name = name;
    currentUser.age = parseInt(age);
    currentUser.gender = gender;
    currentUser.pronoun = pronoun;
    currentUser.orientation = orientation;
    currentUser.relationship = relationship;
    currentUser.bio = bio;
    currentUser.additionalInfo = additionalInfo;
    
    // Atualizar senha se fornecida
    if (newPassword) {
        currentUser.password = newPassword;
    }
    
    // Atualizar foto se fornecida
    if (photoInput.files && photoInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            currentUser.photo = e.target.result;
            saveUserAndReturn();
        };
        reader.readAsDataURL(photoInput.files[0]);
    } else {
        saveUserAndReturn();
    }
}

function saveUserAndReturn() {
    // Atualizar o usuário no array de usuários
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    if (userIndex !== -1) {
        users[userIndex] = currentUser;
    }
    
    // Salvar no localStorage
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    // Atualizar a seção de perfil
    updateProfileSection();
    
    // Voltar para a tela de perfil
    backToProfile();
}

// Carregar perfil
function loadNextProfile() {
    if (currentProfileIndex >= mockUsers.length) {
        currentProfileIndex = 0;
    }

    const profile = mockUsers[currentProfileIndex];
    currentPhotoIndex = 0;
    
    // Carregar todas as fotos do perfil
    currentProfilePhotos = [
        profile.photo,
        ...(profile.publicPhotos || []),
        ...(profile.privatePhotos || [])
    ];
    
    updatePhotoGallery();
    updateProfileInfo(profile);
}

function updatePhotoGallery() {
    const photoSlider = document.querySelector('.photo-slider');
    const photoDots = document.querySelector('.photo-dots');
    const photoCounter = document.querySelector('.photo-counter');
    const photoPreview = document.querySelector('.photo-preview');
    
    // Limpar galeria atual
    photoSlider.innerHTML = '';
    photoDots.innerHTML = '';
    
    // Adicionar fotos
    currentProfilePhotos.forEach((photo, index) => {
        const photoElement = document.createElement('div');
        photoElement.className = 'card-photo';
        photoElement.style.backgroundImage = `url(${photo})`;
        photoSlider.appendChild(photoElement);
        
        // Adicionar dot
        const dot = document.createElement('div');
        dot.className = `photo-dot ${index === 0 ? 'active' : ''}`;
        dot.onclick = () => goToPhoto(index);
        photoDots.appendChild(dot);
    });
    
    // Atualizar contador
    photoCounter.textContent = `${currentPhotoIndex + 1}/${currentProfilePhotos.length}`;
    
    // Atualizar preview
    if (currentPhotoIndex < currentProfilePhotos.length - 1) {
        photoPreview.style.backgroundImage = `url(${currentProfilePhotos[currentPhotoIndex + 1]})`;
        photoPreview.style.display = 'block';
    } else {
        photoPreview.style.display = 'none';
    }
    
    // Atualizar posição do slider
    updateSliderPosition();
}

function updateSliderPosition() {
    const photoSlider = document.querySelector('.photo-slider');
    photoSlider.style.transform = `translateX(-${currentPhotoIndex * 100}%)`;
    
    // Atualizar dots
    document.querySelectorAll('.photo-dot').forEach((dot, index) => {
        dot.classList.toggle('active', index === currentPhotoIndex);
    });
}

function prevPhoto() {
    if (currentPhotoIndex > 0) {
        currentPhotoIndex--;
        updateSliderPosition();
    }
}

function nextPhoto() {
    if (currentPhotoIndex < currentProfilePhotos.length - 1) {
        currentPhotoIndex++;
        updateSliderPosition();
    }
}

function goToPhoto(index) {
    currentPhotoIndex = index;
    updateSliderPosition();
}

function updateProfileInfo(profile) {
    const card = document.querySelector('.card');
    
    card.querySelector('.name').textContent = `${profile.name}, ${profile.age}`;
    card.querySelector('.pronoun').textContent = profile.pronoun;
    
    // Mapear orientação para texto amigável
    const orientationMap = {
        'heterossexual': 'Heterossexual',
        'homossexual': 'Homossexual',
        'bissexual': 'Bissexual',
        'pansexual': 'Pansexual',
        'assexual': 'Assexual',
        'demissexual': 'Demissexual',
        'fluid': 'Fluido',
        'queer': 'Queer',
        'arromantico': 'Arromântico',
        'poliamoroso': 'Poliamoroso',
        'outro': 'Outro'
    };
    
    card.querySelector('.orientation').textContent = orientationMap[profile.orientation] || profile.orientation;
    card.querySelector('.bio').textContent = profile.bio;
    card.querySelector('.additional-info').textContent = profile.additionalInfo;
}

// Swipe e Match
function handleSwipe(direction) {
    const card = document.querySelector('.card');
    card.classList.add(direction === 'right' ? 'swipe-right' : 'swipe-left');

    if (direction === 'right') {
        // Simular match aleatório (30% de chance)
        if (Math.random() < 0.3) {
            setTimeout(() => {
                showMatchScreen(mockUsers[currentProfileIndex]);
            }, 300);
        }
    }

    setTimeout(() => {
        card.classList.remove('swipe-right', 'swipe-left');
        currentProfileIndex++;
        loadNextProfile();
    }, 300);
}

// Tela de Match
function showMatchScreen(matchedUser) {
    const matchScreen = document.getElementById('match-screen');
    const profiles = matchScreen.querySelectorAll('.profile');
    
    profiles[0].style.backgroundImage = `url(${currentUser.photo})`;
    profiles[1].style.backgroundImage = `url(${matchedUser.photo})`;
    
    showScreen('match-screen');
    
    // Adicionar ao histórico de matches
    matches.push(matchedUser);
    localStorage.setItem('matches', JSON.stringify(matches));
    updateMatchesSection();
}

// Chat
function startChat() {
    showScreen('chat-screen');
    loadChat();
}

function loadChat() {
    const chatMessages = document.querySelector('.chat-messages');
    chatMessages.innerHTML = '';
    
    const currentChat = chats[currentUser.id] || [];
    currentChat.forEach(message => {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', message.sender === currentUser.id ? 'sent' : 'received');
        messageElement.textContent = message.text;
        chatMessages.appendChild(messageElement);
    });
    
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Sistema de chat melhorado
let typingTimeout;
const TYPING_TIMEOUT = 1000;

function handleTyping() {
    const input = document.querySelector('.chat-input input');
    const typingIndicator = document.querySelector('.typing-indicator');
    
    clearTimeout(typingTimeout);
    typingIndicator.style.display = 'flex';
    
    typingTimeout = setTimeout(() => {
        typingIndicator.style.display = 'none';
    }, TYPING_TIMEOUT);
}

// Função para enviar mensagem com suporte a upload local
async function sendMessage() {
    const text = chatInput.value.trim();
    const files = mediaInput.files;

    if (!text && files.length === 0) return;

    const formData = new FormData();
    formData.append('text', text);
    formData.append('receiverId', currentChatUser.id);

    for (let file of files) {
        formData.append('media', file);
    }

    try {
        const response = await fetch('/api/messages/send/' + currentChatUser.id, {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            const message = await response.json();
            addMessageToChat(message);
            chatInput.value = '';
            mediaInput.value = '';
            mediaPreview.innerHTML = '';
        }
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        alert('Erro ao enviar mensagem');
    }
}

function addReaction(messageId, reaction) {
    const message = chats[currentUser.id].find(m => m.timestamp === messageId);
    if (message) {
        if (!message.reactions) {
            message.reactions = [];
        }
        
        const existingReaction = message.reactions.find(r => r.userId === currentUser.id);
        if (existingReaction) {
            existingReaction.type = reaction;
        } else {
            message.reactions.push({
                userId: currentUser.id,
                type: reaction
            });
        }
        
        localStorage.setItem('chats', JSON.stringify(chats));
        updateChatMessages();
    }
}

function backToMain() {
    showScreen('main-screen');
}

// Atualizar seções
function updateProfileSection() {
    const profilePhoto = document.querySelector('.profile-photo');
    const profileName = document.querySelector('.profile-name');
    
    profilePhoto.style.backgroundImage = `url(${currentUser.photo})`;
    profileName.textContent = currentUser.name;
}

function updateMatchesSection() {
    const matchesGrid = document.querySelector('.matches-grid');
    matchesGrid.innerHTML = '';
    
    matches.forEach(match => {
        const matchCard = document.createElement('div');
        matchCard.classList.add('match-card');
        matchCard.innerHTML = `
            <div class="match-photo" style="background-image: url(${match.photo})"></div>
            <div class="match-info">
                <h3>${match.name}</h3>
            </div>
        `;
        matchCard.onclick = () => startChat();
        matchesGrid.appendChild(matchCard);
    });
}

function updateChatsSection() {
    const chatsList = document.querySelector('.chats-list');
    chatsList.innerHTML = '';
    
    Object.entries(chats).forEach(([userId, messages]) => {
        const lastMessage = messages[messages.length - 1];
        const chatItem = document.createElement('div');
        chatItem.classList.add('chat-item');
        chatItem.innerHTML = `
            <div class="chat-photo" style="background-image: url(${currentUser.photo})"></div>
            <div class="chat-info">
                <div class="chat-name">${currentUser.name}</div>
                <div class="chat-last-message">${lastMessage.text}</div>
            </div>
        `;
        chatItem.onclick = () => startChat();
        chatsList.appendChild(chatItem);
    });
}

// Função para atualizar a exibição do perfil
function updateProfileDisplay() {
    const currentUser = getCurrentUser();
    if (!currentUser) return;

    // Atualiza a foto do perfil
    const profilePhoto = document.querySelector('#profile-section .profile-photo');
    if (currentUser.photo) {
        profilePhoto.style.backgroundImage = `url(${currentUser.photo})`;
    }

    // Atualiza o nome do perfil
    document.querySelector('#profile-section .profile-name').textContent = currentUser.name;

    // Atualiza as informações do perfil
    document.getElementById('profile-age').textContent = currentUser.age || 'Não informado';
    
    // Mapeia os valores para exibição amigável
    const genderMap = {
        'cis': 'Cisgênero',
        'trans': 'Transgênero',
        'nao-binario': 'Não-binário',
        'genderqueer': 'Genderqueer',
        'genderfluid': 'Gênero Fluido',
        'agenero': 'Agênero',
        'bigenero': 'Bigênero',
        'outro-genero': 'Outro'
    };
    
    const pronounMap = {
        'ele/dele': 'ele/dele',
        'ela/dela': 'ela/dela',
        'elu/delu': 'elu/delu',
        'ile/dile': 'ile/dile',
        'outro': 'Outro'
    };
    
    const orientationMap = {
        'heterossexual': 'Heterossexual',
        'homossexual': 'Homossexual',
        'bissexual': 'Bissexual',
        'pansexual': 'Pansexual',
        'assexual': 'Assexual',
        'demissexual': 'Demissexual',
        'fluid': 'Fluido',
        'queer': 'Queer',
        'arromantico': 'Arromântico',
        'poliamoroso': 'Poliamoroso',
        'outro': 'Outro'
    };
    
    const relationshipMap = {
        'solteiro': 'Solteiro(a)',
        'solteiro-nao-mono': 'Solteiro(a) Não Monogâmico(a)',
        'casado': 'Casado(a)',
        'casado-nao-mono': 'Casado(a) Não Monogâmico(a)',
        'relacionamento-aberto': 'Em Relacionamento Aberto',
        'unicornio': 'Unicórnio',
        'poliamoroso': 'Poliamoroso(a)',
        'outro-relacionamento': 'Outro'
    };
    
    document.getElementById('profile-gender').textContent = genderMap[currentUser.gender] || 'Não informado';
    document.getElementById('profile-pronoun').textContent = pronounMap[currentUser.pronoun] || 'Não informado';
    document.getElementById('profile-orientation').textContent = orientationMap[currentUser.orientation] || 'Não informado';
    document.getElementById('profile-relationship').textContent = relationshipMap[currentUser.relationship] || 'Não informado';
    document.getElementById('profile-bio').textContent = currentUser.bio || 'Não informado';
    document.getElementById('profile-additional').textContent = currentUser.additionalInfo || 'Não informado';
    
    // Inicializar o álbum de fotos
    initPhotoAlbum();
}

// Função para mostrar a seção de perfil
function showProfileSection() {
    hideAllSections();
    document.getElementById('profile-section').classList.add('active');
    updateProfileDisplay();
}

// Atualiza a função showSection para incluir a atualização do perfil
function showSection(sectionName) {
    hideAllSections();
    document.getElementById(`${sectionName}-section`).classList.add('active');
    
    // Atualiza o menu ativo
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`.menu-item[onclick="showSection('${sectionName}')"]`).classList.add('active');
    
    // Atualiza o conteúdo da seção
    switch(sectionName) {
        case 'profile':
            updateProfileDisplay();
            break;
        case 'matches':
            updateMatchesSection();
            break;
        case 'chats':
            updateChatsSection();
            break;
        case 'swipe':
            loadNextProfile();
            break;
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Carregar usuários salvos
    const savedUsers = localStorage.getItem('users');
    if (savedUsers) {
        users = JSON.parse(savedUsers);
    }

    // Carregar usuário atual
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showScreen('main-screen');
        loadNextProfile();
        updateProfileSection();
    }

    // Carregar matches salvos
    const savedMatches = localStorage.getItem('matches');
    if (savedMatches) {
        matches = JSON.parse(savedMatches);
        updateMatchesSection();
    }

    // Carregar chats salvos
    const savedChats = localStorage.getItem('chats');
    if (savedChats) {
        chats = JSON.parse(savedChats);
        updateChatsSection();
    }

    // Adicionar listeners para os botões de swipe
    document.querySelector('.like').addEventListener('click', () => handleSwipe('right'));
    document.querySelector('.dislike').addEventListener('click', () => handleSwipe('left'));

    // Adicionar listeners para gestos de swipe
    const card = document.querySelector('.card');
    card.addEventListener('touchstart', handleTouchStart);
    card.addEventListener('touchmove', handleTouchMove);
    card.addEventListener('touchend', handleTouchEnd);
    
    // Adicionar listener para digitação
    const chatInput = document.querySelector('.chat-input input');
    chatInput.addEventListener('input', handleTyping);
    
    // Inicializar analytics
    updateAnalytics();
});

// Função para inicializar o álbum de fotos
function initPhotoAlbum() {
    // Carregar álbuns salvos do localStorage
    const savedAlbums = localStorage.getItem('photoAlbums');
    if (savedAlbums) {
        photoAlbums = JSON.parse(savedAlbums);
    }
    
    // Carregar solicitações de acesso
    const savedRequests = localStorage.getItem('accessRequests');
    if (savedRequests) {
        accessRequests = JSON.parse(savedRequests);
    }
    
    // Renderizar álbuns
    renderPhotoAlbums();
    
    // Adicionar event listeners para filtros
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const filter = this.getAttribute('data-filter');
            filterAlbums(filter);
        });
    });
    
    // Adicionar proteção contra download/prints
    addPhotoProtection();
}

// Função para renderizar os álbuns de fotos
function renderPhotoAlbums() {
    const publicAlbum = document.getElementById('public-album');
    const privateAlbum = document.getElementById('private-album');
    
    // Limpar álbuns
    publicAlbum.innerHTML = '';
    privateAlbum.innerHTML = '';
    
    // Renderizar fotos públicas
    photoAlbums.public.forEach((photo, index) => {
        const photoElement = createPhotoElement(photo, 'public', index);
        publicAlbum.appendChild(photoElement);
    });
    
    // Renderizar fotos privadas (apenas se for o dono do perfil ou tiver acesso)
    if (isCurrentUser() || hasAccessToPrivateAlbum()) {
        photoAlbums.private.forEach((photo, index) => {
            const photoElement = createPhotoElement(photo, 'private', index);
            privateAlbum.appendChild(photoElement);
        });
    } else {
        // Mostrar mensagem de álbum privado
        const privateMessage = document.createElement('div');
        privateMessage.className = 'private-album-message';
        privateMessage.innerHTML = `
            <div class="private-album-icon">🔒</div>
            <p>Álbum Privado</p>
            <p>Este álbum contém fotos privadas que só podem ser visualizadas após um match.</p>
            <button class="request-access-btn" onclick="showRequestAccessModal()">Solicitar Acesso</button>
        `;
        privateAlbum.appendChild(privateMessage);
    }
}

// Função para verificar se o usuário tem acesso ao álbum privado
function hasAccessToPrivateAlbum() {
    const currentUser = getCurrentUser();
    const profileUser = getProfileUser();
    
    if (!currentUser || !profileUser) return false;
    
    // Se for o próprio usuário, tem acesso
    if (currentUser.id === profileUser.id) return true;
    
    // Verificar se há uma solicitação aprovada
    const requests = accessRequests[profileUser.id] || [];
    const approvedRequest = requests.find(req => 
        req.from === currentUser.id && 
        req.status === 'approved'
    );
    
    return !!approvedRequest;
}

// Função para criar elemento de foto
function createPhotoElement(photo, type, index) {
    const photoItem = document.createElement('div');
    photoItem.className = 'photo-item';
    photoItem.setAttribute('data-index', index);
    photoItem.setAttribute('data-type', type);
    
    const img = document.createElement('img');
    img.src = photo.url;
    img.alt = photo.description || 'Foto do álbum';
    img.setAttribute('data-protected', 'true');
    
    const overlay = document.createElement('div');
    overlay.className = 'photo-overlay';
    
    const info = document.createElement('div');
    info.className = 'photo-info';
    
    if (photo.description) {
        const desc = document.createElement('p');
        desc.textContent = photo.description;
        info.appendChild(desc);
    }
    
    const date = document.createElement('p');
    date.textContent = new Date(photo.date).toLocaleDateString();
    info.appendChild(date);
    
    overlay.appendChild(info);
    photoItem.appendChild(img);
    photoItem.appendChild(overlay);
    
    // Adicionar indicador de privacidade
    if (type === 'private') {
        const privacy = document.createElement('div');
        privacy.className = 'photo-privacy';
        privacy.textContent = '🔒';
        photoItem.appendChild(privacy);
    }
    
    // Adicionar evento de clique
    photoItem.addEventListener('click', function() {
        if (type === 'private' && !isCurrentUser() && !hasAccessToPrivateAlbum()) {
            showRequestAccessModal();
        } else {
            showPhotoViewer(photo, type, index);
        }
    });
    
    return photoItem;
}

// Função para filtrar álbuns
function filterAlbums(filter) {
    const publicAlbum = document.getElementById('public-album');
    const privateAlbum = document.getElementById('private-album');
    
    // Atualizar botões de filtro
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-filter') === filter) {
            btn.classList.add('active');
        }
    });
    
    // Mostrar/esconder álbuns
    if (filter === 'public') {
        publicAlbum.style.display = 'grid';
        privateAlbum.style.display = 'none';
    } else {
        publicAlbum.style.display = 'none';
        privateAlbum.style.display = 'grid';
    }
}

// Função para mostrar modal de adicionar foto
function showAddPhotoModal() {
    const modal = document.getElementById('add-photo-modal');
    modal.style.display = 'block';
    
    // Limpar formulário
    document.getElementById('photo-upload').value = '';
    document.getElementById('photo-privacy').value = 'public';
    document.getElementById('photo-description').value = '';
    
    // Verificar limites de fotos
    updatePhotoLimits();
}

// Função para atualizar os limites de fotos no modal
function updatePhotoLimits() {
    const publicCount = photoAlbums.public.length;
    const privateCount = photoAlbums.private.length;
    const totalCount = publicCount + privateCount;
    
    const privacySelect = document.getElementById('photo-privacy');
    const addButton = document.querySelector('#add-photo-modal .save-btn');
    
    // Desabilitar opções se atingiu o limite
    if (publicCount >= 4) {
        privacySelect.querySelector('option[value="public"]').disabled = true;
    } else {
        privacySelect.querySelector('option[value="public"]').disabled = false;
    }
    
    if (privateCount >= 5) {
        privacySelect.querySelector('option[value="private"]').disabled = true;
    } else {
        privacySelect.querySelector('option[value="private"]').disabled = false;
    }
    
    // Desabilitar botão se atingiu o limite total
    if (totalCount >= 9) {
        addButton.disabled = true;
        addButton.textContent = 'Limite de fotos atingido';
    } else {
        addButton.disabled = false;
        addButton.textContent = 'Adicionar Foto';
    }
}

// Função para adicionar foto ao álbum
function addPhotoToAlbum() {
    const photoInput = document.getElementById('photo-upload');
    const privacySelect = document.getElementById('photo-privacy');
    const descriptionInput = document.getElementById('photo-description');
    
    if (!photoInput.files || !photoInput.files[0]) {
        alert('Por favor, selecione uma foto');
        return;
    }
    
    const privacy = privacySelect.value;
    const description = descriptionInput.value;
    
    // Verificar limite de fotos
    if (privacy === 'public' && photoAlbums.public.length >= 4) {
        alert('Você já atingiu o limite de 4 fotos públicas');
        return;
    }
    
    if (privacy === 'private' && photoAlbums.private.length >= 5) {
        alert('Você já atingiu o limite de 5 fotos privadas');
        return;
    }
    
    // Verificar limite total de fotos
    if (photoAlbums.public.length + photoAlbums.private.length >= 9) {
        alert('Você já atingiu o limite total de 9 fotos');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const photo = {
            url: e.target.result,
            description: description,
            date: new Date().toISOString(),
            privacy: privacy
        };
        
        photoAlbums[privacy].push(photo);
        localStorage.setItem('photoAlbums', JSON.stringify(photoAlbums));
        
        renderPhotoAlbums();
        closeAddPhotoModal();
    };
    
    reader.readAsDataURL(photoInput.files[0]);
}

// Função para mostrar visualizador de fotos
function showPhotoViewer(photo, type, index) {
    const modal = document.getElementById('view-photo-modal');
    const fullPhoto = document.getElementById('full-photo');
    const photoTitle = document.getElementById('photo-title');
    const photoDescription = document.getElementById('photo-description-display');
    const photoDate = document.getElementById('photo-date');
    
    fullPhoto.src = photo.url;
    photoTitle.textContent = type === 'private' ? 'Foto Privada' : 'Foto';
    photoDescription.textContent = photo.description || '';
    photoDate.textContent = new Date(photo.date).toLocaleDateString();
    
    modal.style.display = 'block';
    
    // Adicionar marca d'água de proteção
    fullPhoto.setAttribute('data-protected', 'true');
    
    // Adicionar evento para fechar modal ao clicar fora da foto
    modal.onclick = function(e) {
        if (e.target === modal) {
            closeViewPhotoModal();
        }
    };
}

// Função para fechar visualizador de fotos
function closeViewPhotoModal() {
    const modal = document.getElementById('view-photo-modal');
    modal.style.display = 'none';
}

// Função para mostrar modal de solicitação de acesso
function showRequestAccessModal() {
    const modal = document.getElementById('request-access-modal');
    modal.style.display = 'block';
    
    // Limpar formulário
    document.getElementById('request-message').value = '';
}

// Função para fechar modal de solicitação de acesso
function closeRequestAccessModal() {
    const modal = document.getElementById('request-access-modal');
    modal.style.display = 'none';
}

// Função para enviar solicitação de acesso
function sendAccessRequest() {
    const messageInput = document.getElementById('request-message');
    const message = messageInput.value;
    
    const currentUser = getCurrentUser();
    const profileUser = getProfileUser();
    
    if (!currentUser || !profileUser) return;
    
    // Verificar se já existe uma solicitação pendente
    const existingRequests = accessRequests[profileUser.id] || [];
    const pendingRequest = existingRequests.find(req => 
        req.from === currentUser.id && 
        req.status === 'pending'
    );
    
    if (pendingRequest) {
        alert('Você já tem uma solicitação pendente para este usuário.');
        closeRequestAccessModal();
        return;
    }
    
    const request = {
        from: currentUser.id,
        fromName: currentUser.name,
        to: profileUser.id,
        message: message,
        date: new Date().toISOString(),
        status: 'pending'
    };
    
    // Adicionar solicitação
    if (!accessRequests[profileUser.id]) {
        accessRequests[profileUser.id] = [];
    }
    
    accessRequests[profileUser.id].push(request);
    localStorage.setItem('accessRequests', JSON.stringify(accessRequests));
    
    alert('Solicitação enviada! O usuário será notificado.');
    closeRequestAccessModal();
}

// Função para aprovar solicitação de acesso
function approveAccessRequest(requestId) {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    const requests = accessRequests[currentUser.id] || [];
    const requestIndex = requests.findIndex(req => req.id === requestId);
    
    if (requestIndex !== -1) {
        requests[requestIndex].status = 'approved';
        accessRequests[currentUser.id] = requests;
        localStorage.setItem('accessRequests', JSON.stringify(accessRequests));
        
        // Atualizar a exibição do álbum
        renderPhotoAlbums();
        
        // Notificar o usuário que solicitou
        alert(`Acesso concedido para ${requests[requestIndex].fromName}`);
    }
}

// Função para negar solicitação de acesso
function denyAccessRequest(requestId) {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    const requests = accessRequests[currentUser.id] || [];
    const requestIndex = requests.findIndex(req => req.id === requestId);
    
    if (requestIndex !== -1) {
        requests[requestIndex].status = 'denied';
        accessRequests[currentUser.id] = requests;
        localStorage.setItem('accessRequests', JSON.stringify(accessRequests));
        
        // Notificar o usuário que solicitou
        alert(`Acesso negado para ${requests[requestIndex].fromName}`);
    }
}

// Função para verificar se o usuário atual é o dono do perfil
function isCurrentUser() {
    const currentUser = getCurrentUser();
    const profileUser = getProfileUser();
    
    return currentUser && profileUser && currentUser.id === profileUser.id;
}

// Função para obter o usuário do perfil atual
function getProfileUser() {
    return currentUser;
}

// Função para adicionar proteção contra download/prints
function addPhotoProtection() {
    // Desabilitar menu de contexto para imagens
    document.addEventListener('contextmenu', function(e) {
        if (e.target.tagName === 'IMG' && e.target.getAttribute('data-protected') === 'true') {
            e.preventDefault();
            alert('Esta imagem está protegida contra download.');
        }
    });
    
    // Desabilitar arrastar imagens
    document.addEventListener('dragstart', function(e) {
        if (e.target.tagName === 'IMG' && e.target.getAttribute('data-protected') === 'true') {
            e.preventDefault();
        }
    });
    
    // Adicionar marca d'água dinâmica
    document.addEventListener('mousemove', function(e) {
        const protectedImages = document.querySelectorAll('img[data-protected="true"]');
        protectedImages.forEach(img => {
            if (img.getBoundingClientRect().top < window.innerHeight && 
                img.getBoundingClientRect().bottom > 0) {
                const rect = img.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                // Criar ou atualizar marca d'água
                let watermark = img.parentElement.querySelector('.watermark');
                if (!watermark) {
                    watermark = document.createElement('div');
                    watermark.className = 'watermark';
                    watermark.textContent = 'Calabouço Dating';
                    img.parentElement.appendChild(watermark);
                }
                
                watermark.style.left = `${x}px`;
                watermark.style.top = `${y}px`;
            }
        });
    });
    
    // Adicionar proteção contra impressão
    window.addEventListener('beforeprint', function() {
        const protectedImages = document.querySelectorAll('img[data-protected="true"]');
        protectedImages.forEach(img => {
            img.style.filter = 'blur(10px)';
        });
    });
    
    window.addEventListener('afterprint', function() {
        const protectedImages = document.querySelectorAll('img[data-protected="true"]');
        protectedImages.forEach(img => {
            img.style.filter = 'none';
        });
    });
}

// Função para mostrar modal de gerenciamento de solicitações
function showManageRequestsModal() {
    const modal = document.getElementById('manage-requests-modal');
    const requestsList = document.getElementById('requests-list');
    const noRequestsMessage = document.getElementById('no-requests-message');
    
    // Limpar lista de solicitações
    requestsList.innerHTML = '';
    
    // Obter solicitações pendentes
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    const requests = accessRequests[currentUser.id] || [];
    const pendingRequests = requests.filter(req => req.status === 'pending');
    
    if (pendingRequests.length === 0) {
        noRequestsMessage.style.display = 'block';
    } else {
        noRequestsMessage.style.display = 'none';
        
        // Adicionar cada solicitação à lista
        pendingRequests.forEach(request => {
            const requestItem = document.createElement('div');
            requestItem.className = 'request-item';
            requestItem.innerHTML = `
                <div class="request-info">
                    <p class="request-from">${request.fromName}</p>
                    <p class="request-date">${new Date(request.date).toLocaleDateString()}</p>
                    ${request.message ? `<p class="request-message">${request.message}</p>` : ''}
                </div>
                <div class="request-actions">
                    <button class="approve-btn" onclick="approveAccessRequest('${request.id}')">Aprovar</button>
                    <button class="deny-btn" onclick="denyAccessRequest('${request.id}')">Negar</button>
                </div>
            `;
            requestsList.appendChild(requestItem);
        });
    }
    
    modal.style.display = 'block';
}

// Função para fechar modal de gerenciamento de solicitações
function closeManageRequestsModal() {
    const modal = document.getElementById('manage-requests-modal');
    modal.style.display = 'none';
}

// Função para fechar modal de adicionar foto
function closeAddPhotoModal() {
    const modal = document.getElementById('add-photo-modal');
    modal.style.display = 'none';
}

// Função para fechar modal de visualização de foto
function closeViewPhotoModal() {
    const modal = document.getElementById('view-photo-modal');
    modal.style.display = 'none';
}

// Função para esconder todas as seções
function hideAllSections() {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
}

// Função para obter o usuário atual
function getCurrentUser() {
    return currentUser;
}

// Função para obter o usuário do perfil atual
function getProfileUser() {
    return currentUser;
}

// Função para atualizar a seção de matches
function updateMatchesSection() {
    const matchesGrid = document.querySelector('.matches-grid');
    matchesGrid.innerHTML = '';
    
    matches.forEach(match => {
        const matchCard = document.createElement('div');
        matchCard.classList.add('match-card');
        matchCard.innerHTML = `
            <div class="match-photo" style="background-image: url(${match.photo})"></div>
            <div class="match-info">
                <h3>${match.name}</h3>
            </div>
        `;
        matchCard.onclick = () => startChat(match);
        matchesGrid.appendChild(matchCard);
    });
}

// Função para atualizar a seção de chats
function updateChatsSection() {
    const chatsList = document.querySelector('.chats-list');
    chatsList.innerHTML = '';
    
    Object.entries(chats).forEach(([userId, messages]) => {
        const lastMessage = messages[messages.length - 1];
        const chatItem = document.createElement('div');
        chatItem.classList.add('chat-item');
        chatItem.innerHTML = `
            <div class="chat-photo" style="background-image: url(${currentUser.photo})"></div>
            <div class="chat-info">
                <div class="chat-name">${currentUser.name}</div>
                <div class="chat-last-message">${lastMessage.text}</div>
            </div>
        `;
        chatItem.onclick = () => startChat();
        chatsList.appendChild(chatItem);
    });
}

// Analytics e Insights
function updateAnalytics() {
    // Atualizar estatísticas de matches
    document.getElementById('total-matches').textContent = matches.length;
    
    // Atualizar visualizações
    const views = parseInt(localStorage.getItem('profileViews') || '0');
    document.getElementById('profile-views').textContent = views;
    
    // Atualizar curtidas
    const likes = parseInt(localStorage.getItem('totalLikes') || '0');
    document.getElementById('total-likes').textContent = likes;
    
    // Atualizar mensagens
    const totalMessages = Object.values(chats).reduce((acc, curr) => acc + curr.length, 0);
    document.getElementById('total-messages').textContent = totalMessages;
    
    // Atualizar gráfico de matches
    updateMatchesChart();
}

function updateMatchesChart() {
    const ctx = document.getElementById('matches-chart').getContext('2d');
    const matchData = {
        labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
        datasets: [{
            label: 'Matches',
            data: [12, 19, 3, 5, 2, 3],
            borderColor: '#ff4d4d',
            tension: 0.4
        }]
    };
    
    new Chart(ctx, {
        type: 'line',
        data: matchData,
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

// Função para abrir o chat
async function openChat(user) {
    currentChat = user;
    chatScreen.style.display = 'flex';
    chatHeader.querySelector('.chat-user-name').textContent = user.name;
    chatHeader.querySelector('.chat-profile-photo').src = user.photo;
    loadMessages(user.id);
}

// Função para carregar mensagens
async function loadMessages(userId) {
    try {
        const response = await fetch(`/chat/${userId}`);
        const messages = await response.json();
        chatMessages.innerHTML = '';
        messages.forEach(message => addMessageToChat(message));
        chatMessages.scrollTop = chatMessages.scrollHeight;
    } catch (error) {
        console.error('Erro ao carregar mensagens:', error);
    }
}

// Função para adicionar mensagem ao chat
function addMessageToChat(message) {
    const messageElement = document.createElement('div');
    messageElement.className = `message ${message.senderId === currentUser.id ? 'sent' : 'received'}`;
    
    let content = `<div class="message-content">${message.content}</div>`;
    
    if (message.media) {
        if (message.media.type.startsWith('image/')) {
            content += `<div class="message-media"><img src="${message.media.url}" alt="Imagem"></div>`;
        } else if (message.media.type.startsWith('video/')) {
            content += `<div class="message-media"><video src="${message.media.url}" controls></video></div>`;
        }
    }
    
    content += `<div class="message-time">${new Date(message.createdAt).toLocaleTimeString()}</div>`;
    
    if (message.reactions && message.reactions.length > 0) {
        content += `<div class="message-reactions">${message.reactions.join(' ')}</div>`;
    }
    
    messageElement.innerHTML = content;
    chatMessages.appendChild(messageElement);
}

// Função para enviar mensagem
async function sendMessage() {
    if (!chatInput.value.trim() && mediaFiles.length === 0) return;
    
    const formData = new FormData();
    formData.append('content', chatInput.value);
    mediaFiles.forEach(file => formData.append('media', file));
    
    try {
        const response = await fetch(`/send/${currentChat.id}`, {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            const message = await response.json();
            addMessageToChat(message);
            chatInput.value = '';
            mediaFiles = [];
            mediaPreview.innerHTML = '';
        }
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
    }
}

// Event Listeners
sendButton.addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

mediaButton.addEventListener('click', () => {
    mediaInput.click();
});

mediaInput.addEventListener('change', (e) => {
    mediaFiles = Array.from(e.target.files);
    mediaPreview.innerHTML = '';
    
    mediaFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = document.createElement(file.type.startsWith('image/') ? 'img' : 'video');
            preview.src = e.target.result;
            if (preview.tagName === 'VIDEO') preview.controls = true;
            mediaPreview.appendChild(preview);
        };
        reader.readAsDataURL(file);
    });
});

backButton.addEventListener('click', () => {
    chatScreen.style.display = 'none';
    currentChat = null;
});

// Simulação de digitação
let typingTimeout;
chatInput.addEventListener('input', () => {
    clearTimeout(typingTimeout);
    typingIndicator.style.display = 'flex';
    
    typingTimeout = setTimeout(() => {
        typingIndicator.style.display = 'none';
    }, 1000);
});

// Configuração do gravador de áudio
if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    audioButton.addEventListener('mousedown', async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            
            mediaRecorder.ondataavailable = (e) => {
                audioChunks.push(e.data);
            };
            
            mediaRecorder.start();
            isRecording = true;
            audioButton.classList.add('recording');
        } catch (error) {
            console.error('Erro ao iniciar gravação:', error);
        }
    });
    
    audioButton.addEventListener('mouseup', () => {
        if (mediaRecorder && isRecording) {
            mediaRecorder.stop();
            isRecording = false;
            audioButton.classList.remove('recording');
            
            mediaRecorder.stream.getTracks().forEach(track => track.stop());
        }
    });
}

// Função auxiliar para formatar duração do áudio
function formatDuration(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Registrar o service worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('ServiceWorker registrado com sucesso:', registration.scope);
            })
            .catch(error => {
                console.log('Falha ao registrar o ServiceWorker:', error);
            });
    });
}

// Gerenciar a instalação do PWA
let deferredPrompt;
const installButton = document.createElement('button');
installButton.textContent = 'Instalar App';
installButton.style.display = 'none';
document.body.appendChild(installButton);

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installButton.style.display = 'block';
});

installButton.addEventListener('click', async () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);
        deferredPrompt = null;
        installButton.style.display = 'none';
    }
});

window.addEventListener('appinstalled', () => {
    console.log('PWA foi instalado');
    installButton.style.display = 'none';
});

// Função para adicionar mensagem de áudio ao chat
function addAudioMessageToChat(message) {
    const messageElement = document.createElement('div');
    messageElement.className = `message ${message.sender === currentUser.id ? 'sent' : 'received'} audio-message`;
    
    const audioPlayer = document.createElement('div');
    audioPlayer.className = 'audio-player';
    
    const playButton = document.createElement('button');
    playButton.className = 'play-button';
    playButton.innerHTML = '<i class="fas fa-play"></i>';
    
    const audio = document.createElement('audio');
    audio.src = message.content;
    audio.controls = true;
    
    audioPlayer.appendChild(playButton);
    audioPlayer.appendChild(audio);
    messageElement.appendChild(audioPlayer);
    
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Atualizar a função addMessageToChat para incluir mensagens de áudio
function addMessageToChat(message) {
    if (message.type === 'audio') {
        addAudioMessageToChat(message);
    } else {
        // ... existing code for other message types ...
    }
} 