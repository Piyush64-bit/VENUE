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
                url: 'http://localhost:5000/api/v1',
                description: 'Local Development Server',
            },
            // {
            //   url: 'https://production-url.com/api',
            //   description: 'Production Server'
            // }
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
    apis: ['./src/modules/**/*.js', './src/app.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
