import { Model, Types } from 'mongoose';
import { AppError } from '../middleware/errorHandler';
import { env } from '../config/env';

export async function assertOwnership<T>(
  ModelClass: Model<T>,
  resourceId: string,
  userId: string
): Promise<any> {
  // Validate standard ObjectId shapes to prevent DB cast failures
  if (!Types.ObjectId.isValid(resourceId)) {
    const err = new Error('Resource not found') as AppError;
    err.statusCode = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }

  // Construct query. Check if userId is valid ObjectId before casting
  const query: any = { _id: new Types.ObjectId(resourceId) };
  if (Types.ObjectId.isValid(userId)) {
    query.userId = new Types.ObjectId(userId);
  } else {
    query.userId = userId;
  }

  let doc = await ModelClass.findOne(query);

  // Development fallback: if no document is found but we are in development mode,
  // search by _id only to let the user retrieve/edit their old mock data seamlessly.
  if (!doc && env.NODE_ENV === 'development') {
    doc = await ModelClass.findOne({ _id: new Types.ObjectId(resourceId) });
  }

  if (!doc) {
    // Return standard 404 NOT_FOUND instead of 403 to prevent resource discovery scans
    const err = new Error('Resource not found') as AppError;
    err.statusCode = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }

  return doc;
}
