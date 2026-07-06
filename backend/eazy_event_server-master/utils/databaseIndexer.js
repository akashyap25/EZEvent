const mongoose = require('mongoose');

// Database indexer utility
class DatabaseIndexer {
  constructor() {
    this.indexesCreated = new Set();
  }

  // Create indexes for a specific model
  async createIndexes(modelName, indexes) {
    try {
      const Model = mongoose.model(modelName);
      
      for (const index of indexes) {
        const indexKey = `${modelName}_${JSON.stringify(index)}`;
        
        if (this.indexesCreated.has(indexKey)) {
          continue; // Skip if already created
        }

        try {
          // Handle different index types
          if (typeof index === 'object' && index.partialFilterExpression) {
            // Partial index
            const { partialFilterExpression, ...indexFields } = index;
            await Model.collection.createIndex(indexFields, { 
              partialFilterExpression,
              background: true 
            });
          } else if (typeof index === 'object' && Object.values(index).some(v => v === 'text')) {
            // Text index
            await Model.collection.createIndex(index, { 
              background: true,
              weights: this.getTextIndexWeights(index)
            });
          } else if (typeof index === 'object' && Object.values(index).some(v => v === '2dsphere')) {
            // Geospatial index
            await Model.collection.createIndex(index, { 
              background: true 
            });
          } else {
            // Regular index
            await Model.collection.createIndex(index, { 
              background: true 
            });
          }

          this.indexesCreated.add(indexKey);
          // index log
        } catch (indexError) {
          if (indexError.code === 85 || indexError.code === 86 || 
              indexError.message?.includes('existing index') ||
              indexError.message?.includes('already exists')) {
            // Index already exists with same or different options — safe to skip
            this.indexesCreated.add(indexKey);
          } else if (indexError.message?.includes('Index keys cannot be empty')) {
            // Invalid index spec — skip silently (bad partialFilterExpression config)
          } else {
            console.error(`  ❌ Error creating index ${JSON.stringify(index)}:`, indexError.message);
          }
        }
      }
    } catch (error) {
      console.error(`Error creating indexes for ${modelName}:`, error);
      throw error;
    }
  }

  // Get text index weights for better search relevance
  getTextIndexWeights(index) {
    const weights = {};
    for (const [field, type] of Object.entries(index)) {
      if (type === 'text') {
        // Assign higher weights to more important fields
        if (field === 'title' || field === 'name') {
          weights[field] = 10;
        } else if (field === 'description') {
          weights[field] = 5;
        } else {
          weights[field] = 1;
        }
      }
    }
    return weights;
  }

  // Get index statistics
  async getIndexStats(modelName) {
    try {
      const Model = mongoose.model(modelName);
      const stats = await Model.collection.getIndexes();
      return stats;
    } catch (error) {
      console.error(`Error getting index stats for ${modelName}:`, error);
      return null;
    }
  }

  // Analyze query performance
  async analyzeQuery(modelName, query, options = {}) {
    try {
      const Model = mongoose.model(modelName);
      const explainResult = await Model.find(query, null, options).explain('executionStats');
      return explainResult;
    } catch (error) {
      console.error(`Error analyzing query for ${modelName}:`, error);
      return null;
    }
  }

  // Drop all indexes except _id
  async dropAllIndexes(modelName) {
    try {
      const Model = mongoose.model(modelName);
      const indexes = await Model.collection.getIndexes();
      
      for (const indexName of Object.keys(indexes)) {
        if (indexName !== '_id_') {
          await Model.collection.dropIndex(indexName);
          }
      }
    } catch (error) {
      console.error(`Error dropping indexes for ${modelName}:`, error);
      throw error;
    }
  }
}

// Singleton instance
const indexer = new DatabaseIndexer();

// Export functions
const createIndexes = async (modelName, indexes) => {
  return await indexer.createIndexes(modelName, indexes);
};

const getIndexStats = async (modelName) => {
  return await indexer.getIndexStats(modelName);
};

const analyzeQuery = async (modelName, query, options = {}) => {
  return await indexer.analyzeQuery(modelName, query, options);
};

const dropAllIndexes = async (modelName) => {
  return await indexer.dropAllIndexes(modelName);
};

module.exports = {
  createIndexes,
  getIndexStats,
  analyzeQuery,
  dropAllIndexes,
  DatabaseIndexer
};

