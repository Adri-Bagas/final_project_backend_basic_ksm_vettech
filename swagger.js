import swaggerAutogen from "swagger-autogen";

const doc = {
    info: {
        title: "MyWaifuList API",
        description: "Final Project Study Club Backend Basic - Waifu Tracker & Leaderboard API",
    },
    host: "localhost:3000",
    schemes: ["http"],
    security: [{ bearerAuth: [] }],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: "http",
                scheme: "bearer",
                bearerFormat: "JWT",
            },
        },
    },
};

const outputFile = "./swagger-output.json";
const routes = ["./app.js"];

swaggerAutogen({ openapi: "3.0.0" })(outputFile, routes, doc);
