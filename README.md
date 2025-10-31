# 🗂️ File Server - Innovatech Solutions

Sistema de gestión de archivos con interfaz web que permite subir, listar, descargar y eliminar archivos desde Amazon S3.

## 🎯 Características

- ✅ **Subir archivos** a S3 mediante interfaz web drag-and-drop
- ✅ **Listar archivos** con información detallada (tamaño, fecha)
- ✅ **Descargar archivos** mediante URLs pre-firmadas
- ✅ **Eliminar archivos** del bucket S3
- ✅ **Estadísticas** en tiempo real (total de archivos, espacio usado)
- ✅ **Interfaz moderna** y responsive
- ✅ **API REST** para integración con otros sistemas

## 🏗️ Arquitectura

```
┌─────────────────┐
│   Navegador     │
│   (Cliente)     │
└────────┬────────┘
         │ HTTP
         ↓
┌─────────────────┐
│   EC2 Server    │
│  Python + HTTP  │
│   Puerto 9000   │
└────────┬────────┘
         │ boto3
         ↓
┌─────────────────┐
│   Amazon S3     │
│     Bucket      │
└─────────────────┘
```

## 📋 Requisitos Previos

1. **Cuenta de AWS** con acceso a S3
2. **Bucket S3** creado
3. **Credenciales AWS** (Access Key + Secret Key)
4. **EC2 Instance** (Ubuntu recomendado) o servidor local
5. **Node.js 18+** (recomendado 20.x LTS)

## 🚀 Instalación en EC2

### Paso 1: Conectarse al EC2

```bash
ssh -i "tu_key.pem" ubuntu@tu-ip-ec2
```

### Paso 2: Instalar Node.js

```bash
# Instalar Node.js 20.x LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar instalación
node --version
npm --version
```

### Paso 3: Clonar el repositorio

```bash
cd ~
git clone https://github.com/Danilepez/innovatech-backend.git
cd innovatech-backend/AWS\ File\ Server
```

### Paso 4: Instalar dependencias

```bash
npm install
```

### Paso 5: Configurar credenciales AWS

```bash
nano .env
```

Edita el archivo con tus credenciales:

```env
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=us-east-2
S3_BUCKET_NAME=innovatech-file-storage
PORT=9000
```

### Paso 6: Crear el bucket S3 (si no existe)

```bash
aws s3 mb s3://innovatech-file-storage --region us-east-2
```

O desde la consola de AWS:
1. Ve a S3 → Create bucket
2. Nombre: `innovatech-file-storage`
3. Región: `us-east-2`
4. Block all public access: **Desactivar** (necesario para URLs pre-firmadas)
5. Create bucket

### Paso 7: Configurar Security Group

En la consola de AWS EC2:

1. Security Groups → Selecciona el SG de tu instancia
2. Inbound Rules → Edit
3. Agregar regla:
   - **Type:** Custom TCP
   - **Port:** 9000
   - **Source:** 0.0.0.0/0 (acceso público) o tu IP específica
   - **Description:** File Server

### Paso 8: Iniciar el servidor

```bash
npm start
```

Deberías ver:

```
============================================================
🗂️  FILE SERVER - INNOVATECH SOLUTIONS
============================================================
Puerto: 9000
Bucket S3: innovatech-file-storage
Región: us-east-2
============================================================

✅ Acceso verificado al bucket: innovatech-file-storage
✅ Servidor iniciado en http://0.0.0.0:9000
📁 Interfaz web: http://localhost:9000
🔗 API Health: http://localhost:9000/api/health
```

### Paso 9: Acceder desde tu navegador

Abre: `http://TU_IP_EC2:9000`

## 📡 API REST

### Endpoints Disponibles

#### 1. Health Check
```
GET /api/health
```
**Respuesta:**
```json
{
  "status": "healthy",
  "service": "file-server",
  "bucket": "innovatech-file-storage"
}
```

#### 2. Subir Archivo
```
POST /api/upload
Content-Type: multipart/form-data
```
**Body:** Form-data con campo `file`

**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "Archivo subido exitosamente",
  "filename": "20251030_143022_documento.pdf",
  "size": 245678,
  "url": "https://innovatech-file-storage.s3.us-east-2.amazonaws.com/20251030_143022_documento.pdf"
}
```

#### 3. Listar Archivos
```
GET /api/files
```
**Respuesta:**
```json
{
  "success": true,
  "files": [
    {
      "name": "20251030_143022_documento.pdf",
      "size": 245678,
      "lastModified": "2025-10-30T14:30:22Z",
      "url": "https://innovatech-file-storage.s3.us-east-2.amazonaws.com/..."
    }
  ],
  "count": 1
}
```

#### 4. Descargar Archivo
```
GET /api/download/{filename}
```
**Respuesta:**
```json
{
  "success": true,
  "url": "https://innovatech-file-storage.s3.us-east-2.amazonaws.com/..."
}
```

#### 5. Eliminar Archivo
```
DELETE /api/delete/{filename}
```
**Respuesta:**
```json
{
  "success": true,
  "message": "Archivo 20251030_143022_documento.pdf eliminado exitosamente"
}
```

## 🔒 Configuración de Permisos S3

### Política del Bucket (Bucket Policy)

Ve a S3 → Tu bucket → Permissions → Bucket Policy:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AllowFileServerAccess",
            "Effect": "Allow",
            "Principal": {
                "AWS": "arn:aws:iam::TU_ACCOUNT_ID:user/TU_USUARIO"
            },
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:DeleteObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::innovatech-file-storage",
                "arn:aws:s3:::innovatech-file-storage/*"
            ]
        }
    ]
}
```

### CORS Configuration

Si accedes desde un dominio diferente:

```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "POST", "DELETE"],
        "AllowedOrigins": ["*"],
        "ExposeHeaders": []
    }
]
```

## 🛠️ Solución de Problemas

### Error: "No module named 'boto3'"
```bash
source venv/bin/activate
pip install boto3 python-dotenv
```

### Error: "Unable to locate credentials"
Verifica que el archivo `.env` tenga las credenciales correctas:
```bash
cat .env
```

### Error: "The specified bucket does not exist"
Crea el bucket:
```bash
aws s3 mb s3://innovatech-file-storage --region us-east-2
```

### Error: "Connection refused" desde navegador
Verifica que el Security Group permita el puerto 9000:
```bash
# Ver reglas actuales
aws ec2 describe-security-groups --group-ids sg-xxxxx
```

### El servidor se detiene al cerrar SSH
Usa `nohup` o `screen`:
```bash
nohup python3 app.py > file-server.log 2>&1 &
```

O con screen:
```bash
screen -S file-server
python3 app.py
# Ctrl+A, D para detach
# screen -r file-server para volver
```

## 📊 Monitoreo

### Ver logs en tiempo real
```bash
tail -f file-server.log
```

### Verificar procesos
```bash
ps aux | grep app.py
```

### Detener el servidor
```bash
pkill -f app.py
```

## 🎨 Personalización

### Cambiar puerto
En `.env`:
```env
PORT=8080
```

### Cambiar bucket
En `.env`:
```env
S3_BUCKET_NAME=mi-otro-bucket
```

### Limitar tamaño de archivos
En `app.py`, línea ~80:
```python
# Agregar validación
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
if len(file_content) > MAX_FILE_SIZE:
    self._set_headers(400, 'application/json')
    self.wfile.write(json.dumps({
        'error': 'Archivo demasiado grande (máximo 10MB)'
    }).encode('utf-8'))
    return
```

## 📈 Mejoras Futuras

- [ ] Autenticación de usuarios (JWT)
- [ ] Límites de cuota por usuario
- [ ] Previsualización de imágenes
- [ ] Búsqueda de archivos
- [ ] Carpetas/organización
- [ ] Compartir archivos con enlaces temporales
- [ ] Integración con CloudFront para CDN
- [ ] Logs a CloudWatch

## 🤝 Contribuciones

Pull requests son bienvenidos. Para cambios mayores, abre un issue primero.

## 📄 Licencia

MIT License - Innovatech Solutions

## 👨‍💻 Autor

**Daniel López**  
Universidad Privada Boliviana
Aplicaciones con Redes - 2025

---

**¿Necesitas ayuda?** Abre un issue en GitHub o contacta al equipo de Innovatech.

