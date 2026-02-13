const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Venue API',
            version: '1.0.0',
            description: 'API documentation for Venue Event Management System',
        },
        servers: [
            {
                url: process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}/api/v1`,
                description: process.env.NODE_ENV === 'production' ? 'Production Server' : 'Local Development Server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    // Path to the API docs
    apis: ['./src/modules/**/*.js', './src/app.js', './src/docs/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
