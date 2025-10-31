#!/bin/bash
# Script de configuración para File Server en EC2 (Node.js)

echo "================================================"
echo "🗂️  INSTALACIÓN DE FILE SERVER - INNOVATECH"
echo "================================================"

# Actualizar sistema
echo "📦 Actualizando sistema..."
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 20.x (LTS)
echo "� Instalando Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar instalación
echo "✅ Node.js instalado: $(node --version)"
echo "✅ npm instalado: $(npm --version)"

# Crear directorio para la aplicación
echo "📁 Creando directorio..."
mkdir -p ~/file-server
cd ~/file-server

# Instalar dependencias
echo "📚 Instalando dependencias de Node.js..."
npm install

# Crear archivo .env
echo "⚙️  Creando archivo de configuración..."
cat > .env << 'EOF'
# Configuración de AWS S3
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_REGION=us-east-2
S3_BUCKET_NAME=innovatech-file-storage

# Configuración del servidor
PORT=9000
EOF

echo ""
echo "================================================"
echo "✅ INSTALACIÓN COMPLETADA"
echo "================================================"
echo ""
echo "📋 PRÓXIMOS PASOS:"
echo ""
echo "1. Edita el archivo .env con tus credenciales AWS:"
echo "   nano .env"
echo ""
echo "2. Asegúrate de tener un bucket S3 creado"
echo ""
echo "3. Configura el Security Group para permitir puerto 9000"
echo ""
echo "4. Copia los archivos server.js, index.html y package.json a este directorio"
echo ""
echo "5. Instala las dependencias:"
echo "   npm install"
echo ""
echo "6. Inicia el servidor:"
echo "   npm start"
echo ""
echo "================================================"
