const APIFeatures = require('../../src/utils/APIFeatures');

// Mock Mongoose query
class MockQuery {
  constructor(data) {
    this.data = data;
    this.queryParams = {};
  }

  find(filter) {
    this.queryParams.filter = filter;
    return this;
  }

  sort(sortBy) {
    this.queryParams.sort = sortBy;
    return this;
  }

  select(fields) {
    this.queryParams.fields = fields;
    return this;
  }

  skip(num) {
    this.queryParams.skip = num;
    return this;
  }

  limit(num) {
    this.queryParams.limit = num;
    return this;
  }
}

describe('APIFeatures', () => {
  let mockData;
  let mockQuery;

  beforeEach(() => {
    mockData = [
      { name: 'Event A', price: 50, category: 'concert' },
      { name: 'Event B', price: 30, category: 'sports' },
      { name: 'Event C', price: 70, category: 'concert' },
    ];
    mockQuery = new MockQuery(mockData);
  });

  describe('filter', () => {
    it('should filter by exact match', () => {
      const queryString = { category: 'concert' };
      const apiFeatures = new APIFeatures(mockQuery, queryString);
      apiFeatures.filter();

      expect(mockQuery.queryParams.filter).toEqual({ category: 'concert' });
    });

    it('should handle comparison operators', () => {
      const queryString = { price: { gte: 40 } };
      const apiFeatures = new APIFeatures(mockQuery, queryString);
      apiFeatures.filter();

      expect(mockQuery.queryParams.filter).toEqual({ price: { $gte: 40 } });
    });

    it('should exclude special fields', () => {
      const queryString = {
        category: 'concert',
        page: 2,
        sort: 'price',
        limit: 10,
        fields: 'name,price',
      };

      const apiFeatures = new APIFeatures(mockQuery, queryString);
      apiFeatures.filter();

      expect(mockQuery.queryParams.filter).toEqual({ category: 'concert' });
      expect(mockQuery.queryParams.filter).not.toHaveProperty('page');
      expect(mockQuery.queryParams.filter).not.toHaveProperty('sort');
      expect(mockQuery.queryParams.filter).not.toHaveProperty('limit');
      expect(mockQuery.queryParams.filter).not.toHaveProperty('fields');
    });
  });

  describe('sort', () => {
    it('should sort by specified field', () => {
      const queryString = { sort: 'price' };
      const apiFeatures = new APIFeatures(mockQuery, queryString);
      apiFeatures.sort();

      expect(mockQuery.queryParams.sort).toBe('price');
    });

    it('should sort by multiple fields', () => {
      const queryString = { sort: 'price,name' };
      const apiFeatures = new APIFeatures(mockQuery, queryString);
      apiFeatures.sort();

      expect(mockQuery.queryParams.sort).toBe('price name');
    });

    it('should use default sort if not specified', () => {
      const queryString = {};
      const apiFeatures = new APIFeatures(mockQuery, queryString);
      apiFeatures.sort();

      expect(mockQuery.queryParams.sort).toBe('-createdAt');
    });
  });

  describe('limitFields', () => {
    it('should select specific fields', () => {
      const queryString = { fields: 'name,price' };
      const apiFeatures = new APIFeatures(mockQuery, queryString);
      apiFeatures.limitFields();

      expect(mockQuery.queryParams.fields).toBe('name price');
    });

    it('should exclude __v by default', () => {
      const queryString = {};
      const apiFeatures = new APIFeatures(mockQuery, queryString);
      apiFeatures.limitFields();

      expect(mockQuery.queryParams.fields).toBe('-__v');
    });
  });

  describe('paginate', () => {
    it('should paginate with default values', () => {
      const queryString = {};
      const apiFeatures = new APIFeatures(mockQuery, queryString);
      apiFeatures.paginate();

      expect(mockQuery.queryParams.skip).toBe(0); // (1 - 1) * 100
      expect(mockQuery.queryParams.limit).toBe(100);
    });

    it('should paginate with custom page and limit', () => {
      const queryString = { page: 3, limit: 5 };
      const apiFeatures = new APIFeatures(mockQuery, queryString);
      apiFeatures.paginate();

      expect(mockQuery.queryParams.skip).toBe(10); // (3 - 1) * 5
      expect(mockQuery.queryParams.limit).toBe(5);
    });

    it('should handle invalid page numbers', () => {
      const queryString = { page: -1, limit: 5 };
      const apiFeatures = new APIFeatures(mockQuery, queryString);
      apiFeatures.paginate();

      expect(mockQuery.queryParams.skip).toBe(-10); // (-1 - 1) * 5
      expect(mockQuery.queryParams.limit).toBe(5);
    });
  });

  describe('method chaining', () => {
    it('should allow chaining all methods', () => {
      const queryString = {
        category: 'concert',
        sort: 'price',
        fields: 'name,price',
        page: 2,
        limit: 5,
      };

      const apiFeatures = new APIFeatures(mockQuery, queryString);
      apiFeatures.filter().sort().limitFields().paginate();

      expect(mockQuery.queryParams.filter).toEqual({ category: 'concert' });
      expect(mockQuery.queryParams.sort).toBe('price');
      expect(mockQuery.queryParams.fields).toBe('name price');
      expect(mockQuery.queryParams.skip).toBe(5);
      expect(mockQuery.queryParams.limit).toBe(5);
    });
  });
});
