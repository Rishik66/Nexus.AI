import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { db } from '../database/db.js';
import { authenticateJWT, AuthRequest } from '../middleware/auth.js';
import { documentAnalysisTool } from '../tools/implementations/documentAnalysis.js';

export const documentRoutes = Router();

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.SERVERLESS_BUNDLE);
const uploadsDir = isServerless ? path.join(os.tmpdir(), 'nexus_uploads') : path.resolve(process.cwd(), 'uploads');
try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
} catch (err) {
  console.warn('[UPLOADS] Warning creating uploads directory:', err);
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const safeName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, safeName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (_req, file, cb) => {
    const allowed = ['.pdf', '.png', '.jpg', '.jpeg', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, PNG, JPG, and WebP files are permitted for document analysis.'));
    }
  },
});

documentRoutes.post('/upload', authenticateJWT, upload.single('file'), async (req: AuthRequest, res: Response) => {
  const businessId = req.businessId || db.getDemoBusiness()?.id || '';

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  // Create Document record
  const doc = db.createDocument({
    business_id: businessId,
    original_name: req.file.originalname,
    file_path: req.file.path,
    mime_type: req.file.mimetype,
    file_size: req.file.size,
    status: 'ANALYZING',
  });

  // Run multimodal document intelligence
  const analysisResult = await documentAnalysisTool.execute(
    {
      documentId: doc.id,
      filePath: req.file.path,
      fileName: req.file.originalname,
      documentType: 'INVOICE',
    },
    {
      businessId,
      agentName: 'SAGE',
    }
  );

  res.status(201).json({
    document: db.getDocumentById(doc.id),
    extracted: analysisResult.extractedData,
    confidence: analysisResult.confidenceScore,
    method: analysisResult.extractionMethod,
    summary: analysisResult.summary,
  });
});

documentRoutes.get('/', authenticateJWT, (req: AuthRequest, res: Response) => {
  const businessId = req.businessId || db.getDemoBusiness()?.id || '';
  const documents = db.getDocuments(businessId);
  res.json({ documents, count: documents.length });
});

documentRoutes.get('/:id', authenticateJWT, (req: AuthRequest, res: Response) => {
  const doc = db.getDocumentById(req.params.id);
  if (!doc) {
    return res.status(404).json({ error: 'Document not found.' });
  }
  res.json({ document: doc });
});
