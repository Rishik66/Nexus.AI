import { Router, Response } from 'express';
import { z } from 'zod';
import { db } from '../database/db.js';
import { authenticateJWT, AuthRequest, requireRole } from '../middleware/auth.js';

export const productRoutes = Router();

const ProductInputSchema = z.object({
  sku: z.string().min(2),
  name: z.string().min(2),
  category: z.string(),
  description: z.string().optional(),
  unit_price: z.number().positive(),
  cost_price: z.number().positive(),
  stock_quantity: z.number().nonnegative(),
  reorder_threshold: z.number().nonnegative(),
  supplier_id: z.string().optional(),
});

productRoutes.get('/', authenticateJWT, (req: AuthRequest, res: Response) => {
  const businessId = req.businessId || db.getDemoBusiness()?.id || '';
  const { category, low_stock, query } = req.query;

  let products = db.getProducts(businessId);
  if (low_stock === 'true') {
    products = products.filter(p => p.stock_quantity <= p.reorder_threshold);
  }
  if (category && typeof category === 'string') {
    products = products.filter(p => p.category.toLowerCase() === category.toLowerCase());
  }
  if (query && typeof query === 'string') {
    const q = query.toLowerCase();
    products = products.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
  }

  res.json({ products, count: products.length });
});

productRoutes.get('/:id', authenticateJWT, (req: AuthRequest, res: Response) => {
  const product = db.getProductById(req.params.id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found.' });
  }
  res.json({ product });
});

productRoutes.post('/', authenticateJWT, requireRole(['ADMIN', 'MANAGER']), (req: AuthRequest, res: Response) => {
  const businessId = req.businessId || db.getDemoBusiness()?.id || '';
  const validated = ProductInputSchema.parse(req.body);

  const product = db.createProduct({
    ...validated,
    business_id: businessId,
  });

  db.logAudit({
    business_id: businessId,
    user_id: req.user?.id,
    action: 'CREATE_PRODUCT',
    entity_type: 'PRODUCT',
    entity_id: product.id,
    details: { sku: product.sku, name: product.name },
  });

  res.status(201).json({ product });
});

productRoutes.patch('/:id', authenticateJWT, requireRole(['ADMIN', 'MANAGER']), (req: AuthRequest, res: Response) => {
  const businessId = req.businessId || db.getDemoBusiness()?.id || '';
  const updated = db.updateProduct(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Product not found.' });
  }

  db.logAudit({
    business_id: businessId,
    user_id: req.user?.id,
    action: 'UPDATE_PRODUCT',
    entity_type: 'PRODUCT',
    entity_id: updated.id,
    details: req.body,
  });

  res.json({ product: updated });
});
