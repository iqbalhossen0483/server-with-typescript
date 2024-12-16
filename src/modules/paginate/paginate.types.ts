import { Document, FilterQuery, Model, PopulateOptions } from 'mongoose';

export interface QueryResult<T> {
  data: T[];
  page: number;
  limit: number;
  pages: number;
  count: number;
}

export interface PaginateOptions {
  sortBy?: string;
  projectBy?: string;
  populate?: string | PopulateOptions | (string | PopulateOptions)[];
  limit?: number;
  page?: number;
  search?: string;
  searchFields?: string[];
  lean?: boolean;
}

export interface PaginateModel<T extends Document> extends Model<T> {
  paginate(filter?: FilterQuery<T>, options?: PaginateOptions): Promise<QueryResult<T>>;
}
