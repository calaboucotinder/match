# Verifica se o Node.js está instalado
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "Node.js não está instalado. Por favor, instale o Node.js primeiro."
    exit 1
}

# Cria diretórios necessários
New-Item -ItemType Directory -Force -Path "public/uploads/photos"
New-Item -ItemType Directory -Force -Path "public/uploads/media"

# Instala dependências
Write-Host "Instalando dependências..."
npm install

# Inicia o servidor
Write-Host "Iniciando servidor..."
npm start 