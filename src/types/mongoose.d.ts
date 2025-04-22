import mongoose from 'mongoose';

// Add missing type definitions for Mongoose to fix TypeScript errors
declare module 'mongoose' {
  interface FilterQuery<T> {
    [key: string]: any;
  }
  
  // Make sure Query type is properly defined
  interface Query<T, DocType extends mongoose.Document, THelpers = {}>
    extends mongoose.Promise<T> {}
  
  // Enhance the model static methods
  interface Model<T extends mongoose.Document, TQueryHelpers = any> {
    find(filter: FilterQuery<T>, projection?: any, options?: any): Query<T[], T>;
    findById(id: any, projection?: any, options?: any): Query<T | null, T>;
    findOne(filter: FilterQuery<T>, projection?: any, options?: any): Query<T | null, T>;
    countDocuments(filter?: FilterQuery<T>): Promise<number>;
  }
}

// Make TypeScript happy with the _id property
declare global {
  namespace Express {
    interface User {
      _id?: string;
    }
  }
} 