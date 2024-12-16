import { Document, FilterQuery, Model, PopulateOptions, QueryOptions, Schema } from 'mongoose';
import { PaginateOptions, QueryResult } from './paginate.types';

function parseSortBy(sortBy?: string): Record<string, 1 | -1> {
  if (!sortBy) return { createdAt: -1 };
  return sortBy.split(',').reduce(
    (acc, sortOption) => {
      const [key, order] = sortOption.split(':');
      if (key && key.trim()) {
        acc[key.trim()] = order === 'desc' ? -1 : 1;
      }
      return acc;
    },
    {} as Record<string, 1 | -1>,
  );
}

function parseProjectBy(projectBy?: string): Record<string, 0 | 1> {
  if (!projectBy) return {};
  return projectBy.split(',').reduce(
    (acc, projectOption) => {
      const [key, include] = projectOption.split(':');
      if (key && key.trim()) {
        acc[key.trim()] = include === 'hide' ? 0 : 1;
      }
      return acc;
    },
    {} as Record<string, 0 | 1>,
  );
}

function parseLimit(limit?: number): number {
  return limit && Number.isInteger(limit) && limit > 0 ? limit : 10;
}

function parsePage(page?: number): number {
  return page && Number.isInteger(page) && page > 0 ? page : 1;
}

function applyPopulate(query: any, populate: string | PopulateOptions | (string | PopulateOptions)[]): any {
  if (typeof populate === 'string') {
    return populate.split(',').reduce((q, path) => q.populate(path.trim()), query);
  }
  return query.populate(populate);
}

function buildSearchQuery(search?: string, searchFields?: string | string[]): FilterQuery<any> {
  if (!search || !searchFields) {
    return {};
  }

  const fields = Array.isArray(searchFields) ? searchFields : [searchFields];
  const searchTerms = search.split(/\s+/).filter((term) => term.length > 0);

  if (searchTerms.length === 0 || fields.length === 0) {
    return {};
  }

  return {
    $and: searchTerms.map((term) => ({
      $or: fields.map((field) => ({
        // eslint-disable-next-line security/detect-non-literal-regexp
        [field]: new RegExp(term, 'i'),
      })),
    })),
  };
}

const paginate = <T extends Document>(schema: Schema<T>): void => {
  /**
   * Query for documents with pagination and search functionality
   * @param {FilterQuery<T>} [filter] - Mongo filter
   * @param {PaginateOptions} [options] - Query options
   * @returns {Promise<QueryResult<T>>}
   */
  schema.static(
    'paginate',
    async function (this: Model<T>, filter: FilterQuery<T> = {}, options: PaginateOptions = {}): Promise<QueryResult<T>> {
      const sort = parseSortBy(options.sortBy);
      const project = parseProjectBy(options.projectBy);
      const limit = parseLimit(options.limit);
      const page = parsePage(options.page);
      const skip = (page - 1) * limit;
      const lean = options.lean ?? false;

      const searchQuery = buildSearchQuery(options.search, options.searchFields);
      const finalFilter = { ...filter, ...searchQuery };

      const queryOptions: QueryOptions = { lean };

      const countPromise = this.countDocuments(finalFilter).exec();
      let docsPromise = this.find(finalFilter).sort(sort).skip(skip).limit(limit).select(project).setOptions(queryOptions);

      if (options.populate) {
        docsPromise = applyPopulate(docsPromise, options.populate);
      }

      try {
        const [totalResults, results] = await Promise.all([countPromise, docsPromise]);
        const totalPages = Math.ceil(totalResults / limit);

        return {
          data: results,
          page,
          limit,
          pages: totalPages,
          count: totalResults,
        };
      } catch (error) {
        throw new Error(`Error in pagination: ${error instanceof Error ? error.message : String(error)}`);
      }
    },
  );
};

export default paginate;
