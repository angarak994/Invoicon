import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodTypeAny } from 'zod';
import { env } from '../config/env';

export function validate(schema: ZodTypeAny) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = (await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params
      })) as any;
      
      // Mount parsed outputs back into standard request parameters securely
      if (parsed.body) {
        req.body = parsed.body;
      }
      if (parsed.query) {
        for (const key in req.query) {
          delete (req.query as any)[key];
        }
        Object.assign(req.query, parsed.query);
      }
      if (parsed.params) {
        for (const key in req.params) {
          delete (req.params as any)[key];
        }
        Object.assign(req.params, parsed.params);
      }
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const fields: Record<string, string[]> = {};
        
        error.issues.forEach((err) => {
          const path = err.path.slice(1).join('.'); // Strip 'body' or 'query' prefix
          if (path) {
            if (!fields[path]) fields[path] = [];
            fields[path].push(err.message);
          }
        });

        if (env.NODE_ENV === 'development') {
          console.warn('\n⚠️ [INPUT VALIDATION FAILED]:');
          console.warn(JSON.stringify(fields, null, 2));
          console.warn('───────────────────────────\n');
        }
        
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Provided request data failed input validations',
            fields
          }
        });
        return;
      }
      
      next(error);
    }
  };
}
