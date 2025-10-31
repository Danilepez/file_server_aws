const express = require('express');
const multer = require('multer');
const { S3Client, PutObjectCommand, ListObjectsV2Command, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const path = require('path');
const dotenv = require('dotenv');

// Cargar variables de entorno
dotenv.config();

// Configuración
const PORT = process.env.PORT || 9000;
const AWS_REGION = process.env.AWS_REGION || 'us-east-2';
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || 'innovatech-file-storage';

// Cliente S3
const s3Client = new S3Client({
    region: AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

// Configurar Express
const app = express();

// Middleware
app.use(express.json());
app.use(express.static(__dirname)); // Sirve index.html y archivos estáticos

// CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Configurar Multer para subir archivos (memoria)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 100 * 1024 * 1024 // 100 MB
    }
});

// ==================== RUTAS ====================

// Health Check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'file-server',
        bucket: S3_BUCKET_NAME,
        region: AWS_REGION
    });
});

// Subir archivo a S3
app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No se encontró el archivo'
            });
        }

        // Generar nombre único con timestamp
        const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
        const uniqueFilename = `${timestamp}_${req.file.originalname}`;

        // Subir a S3
        const command = new PutObjectCommand({
            Bucket: S3_BUCKET_NAME,
            Key: uniqueFilename,
            Body: req.file.buffer,
            ContentType: req.file.mimetype
        });

        await s3Client.send(command);

        console.log(`✅ Archivo subido: ${uniqueFilename} (${req.file.size} bytes)`);

        res.status(201).json({
            success: true,
            message: 'Archivo subido exitosamente',
            filename: uniqueFilename,
            size: req.file.size,
            url: `https://${S3_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${uniqueFilename}`
        });

    } catch (error) {
        console.error('❌ Error al subir archivo:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Listar archivos en S3
app.get('/api/files', async (req, res) => {
    try {
        const command = new ListObjectsV2Command({
            Bucket: S3_BUCKET_NAME
        });

        const response = await s3Client.send(command);

        const files = (response.Contents || []).map(obj => ({
            name: obj.Key,
            size: obj.Size,
            lastModified: obj.LastModified.toISOString(),
            url: `https://${S3_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${obj.Key}`
        }));

        res.json({
            success: true,
            files: files,
            count: files.length
        });

    } catch (error) {
        console.error('❌ Error al listar archivos:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Generar URL de descarga (pre-firmada)
app.get('/api/download/:filename', async (req, res) => {
    try {
        const filename = decodeURIComponent(req.params.filename);

        const command = new GetObjectCommand({
            Bucket: S3_BUCKET_NAME,
            Key: filename
        });

        // Generar URL pre-firmada válida por 1 hora
        const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

        res.json({
            success: true,
            url: url
        });

    } catch (error) {
        console.error('❌ Error al generar URL de descarga:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Eliminar archivo de S3
app.delete('/api/delete/:filename', async (req, res) => {
    try {
        const filename = decodeURIComponent(req.params.filename);

        const command = new DeleteObjectCommand({
            Bucket: S3_BUCKET_NAME,
            Key: filename
        });

        await s3Client.send(command);

        console.log(`🗑️ Archivo eliminado: ${filename}`);

        res.json({
            success: true,
            message: `Archivo ${filename} eliminado exitosamente`
        });

    } catch (error) {
        console.error('❌ Error al eliminar archivo:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Servir index.html en la raíz
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ==================== INICIAR SERVIDOR ====================

async function verifyS3Access() {
    try {
        const command = new ListObjectsV2Command({
            Bucket: S3_BUCKET_NAME,
            MaxKeys: 1
        });
        await s3Client.send(command);
        console.log(`✅ Acceso verificado al bucket: ${S3_BUCKET_NAME}`);
        return true;
    } catch (error) {
        console.error(`❌ Error al acceder al bucket ${S3_BUCKET_NAME}:`, error.message);
        console.error('   Asegúrate de que:');
        console.error('   1. El bucket existe');
        console.error('   2. Las credenciales AWS son correctas');
        console.error('   3. Tienes permisos de lectura/escritura');
        return false;
    }
}

app.listen(PORT, async () => {
    console.log('\n' + '='.repeat(60));
    console.log('🗂️  FILE SERVER - INNOVATECH SOLUTIONS');
    console.log('='.repeat(60));
    console.log(`Puerto: ${PORT}`);
    console.log(`Bucket S3: ${S3_BUCKET_NAME}`);
    console.log(`Región: ${AWS_REGION}`);
    console.log('='.repeat(60) + '\n');

    // Verificar acceso a S3
    const hasAccess = await verifyS3Access();
    if (!hasAccess) {
        console.warn('\n⚠️  ADVERTENCIA: No se pudo verificar el acceso a S3');
        console.warn('El servidor se iniciará, pero las operaciones pueden fallar\n');
    }

    console.log(`✅ Servidor iniciado en http://0.0.0.0:${PORT}`);
    console.log(`📁 Interfaz web: http://localhost:${PORT}`);
    console.log(`🔗 API Health: http://localhost:${PORT}/api/health`);
    console.log('\nPresiona Ctrl+C para detener el servidor\n');
});

// Manejo de errores
process.on('unhandledRejection', (error) => {
    console.error('❌ Error no manejado:', error);
});
