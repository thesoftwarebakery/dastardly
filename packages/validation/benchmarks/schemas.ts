/**
 * Test schemas for benchmarking
 * Covering various complexity levels
 */

export const schemas = {
  // Simple schema - basic type checking
  simple: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      age: { type: 'number' },
      email: { type: 'string' },
    },
    required: ['name', 'email'],
  },

  // Medium schema - with validation rules
  medium: {
    type: 'object',
    properties: {
      name: { type: 'string', minLength: 1, maxLength: 100 },
      age: { type: 'number', minimum: 0, maximum: 150 },
      email: { type: 'string', pattern: '^[^@]+@[^@]+$' },
      tags: {
        type: 'array',
        items: { type: 'string' },
        minItems: 1,
        maxItems: 10,
      },
    },
    required: ['name', 'email'],
  },

  // Complex schema - nested objects, refs, combinators
  complex: {
    type: 'object',
    definitions: {
      address: {
        type: 'object',
        properties: {
          street: { type: 'string' },
          city: { type: 'string' },
          country: { type: 'string' },
          zipCode: { type: 'string', pattern: '^[0-9]{5}$' },
        },
        required: ['street', 'city', 'country'],
      },
    },
    properties: {
      user: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1 },
          age: { type: 'number', minimum: 0 },
          email: { type: 'string', format: 'email' },
          addresses: {
            type: 'array',
            items: { $ref: '#/definitions/address' },
            minItems: 1,
          },
        },
        required: ['name', 'email'],
      },
      metadata: {
        type: 'object',
        properties: {
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
    },
    required: ['user'],
  },

  // Wide schema - many properties
  wide: {
    type: 'object',
    properties: Object.fromEntries(
      Array.from({ length: 50 }, (_, i) => [`field${i}`, { type: 'string' }])
    ),
  },

  // Deep schema - nested objects
  deep: {
    type: 'object',
    properties: {
      level1: {
        type: 'object',
        properties: {
          level2: {
            type: 'object',
            properties: {
              level3: {
                type: 'object',
                properties: {
                  level4: {
                    type: 'object',
                    properties: {
                      level5: {
                        type: 'object',
                        properties: {
                          value: { type: 'string' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },

  // Array heavy schema
  arrayHeavy: {
    type: 'object',
    properties: {
      items: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            name: { type: 'string' },
            tags: { type: 'array', items: { type: 'string' } },
          },
          required: ['id', 'name'],
        },
        minItems: 1,
      },
    },
  },
};

export const testData = {
  simple: {
    valid: { name: 'John', age: 30, email: 'john@example.com' },
    invalid: { name: 'John', age: 'thirty' },
  },

  medium: {
    valid: {
      name: 'John Doe',
      age: 30,
      email: 'john@example.com',
      tags: ['developer', 'javascript'],
    },
    invalid: {
      name: 'John Doe',
      age: 200,
      email: 'invalid-email',
      tags: [],
    },
  },

  complex: {
    valid: {
      user: {
        name: 'John Doe',
        age: 30,
        email: 'john@example.com',
        addresses: [
          {
            street: '123 Main St',
            city: 'New York',
            country: 'USA',
            zipCode: '10001',
          },
        ],
      },
      metadata: {
        createdAt: '2023-01-01T12:00:00Z',
        updatedAt: '2023-01-02T12:00:00Z',
      },
    },
    invalid: {
      user: {
        name: '',
        email: 'invalid-email',
        addresses: [],
      },
    },
  },

  wide: {
    valid: Object.fromEntries(
      Array.from({ length: 50 }, (_, i) => [`field${i}`, `value${i}`])
    ),
    invalid: Object.fromEntries(
      Array.from({ length: 50 }, (_, i) => [`field${i}`, i])
    ),
  },

  deep: {
    valid: {
      level1: {
        level2: {
          level3: {
            level4: {
              level5: {
                value: 'deep value',
              },
            },
          },
        },
      },
    },
    invalid: {
      level1: {
        level2: {
          level3: {
            level4: {
              level5: {
                value: 123,
              },
            },
          },
        },
      },
    },
  },

  arrayHeavy: {
    valid: {
      items: Array.from({ length: 100 }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
        tags: ['tag1', 'tag2', 'tag3'],
      })),
    },
    invalid: {
      items: Array.from({ length: 100 }, (_, i) => ({
        id: `${i}`,
        name: `Item ${i}`,
      })),
    },
  },
};
