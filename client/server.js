import * as dotenv from "dotenv";
import express from "express";
import path from "path";
import fs from "fs"

/** 
 * Set Environment Variables 
 */
//dotenv.config({ path: "../.env" });
dotenv.config({ path: ".env" });

/**
 * Check if ./dist dir exists, error if it does not
 */
fs.access("./dist", function (error) {
    if (error) {
        throw new Error("Dist directory does not exist, use 'npm run build' to create it.")
    };
});

const dirname = path.resolve();

/**
 * New express instance
 */
const app = express();

/** 
 * Serves the 'dist' folder to the server
 */
app.use(express.static("./dist"));
app.get('/', (_, res) => {
    res.sendFile(dirname + "/index.html");
});

/**
 * Servers port from .env file, if it is undefined, error.
 */
if (!process.env.VITE_FRONTEND_PORT) {
    throw new Error("No frontend port provided for express server, provide one in the .env file")
};

/** 
 * Express server listening
 */
app.listen(process.env.VITE_FRONTEND_PORT, () => {
    console.log(`Server started at http://localhost:${process.env.VITE_FRONTEND_PORT}/`)
});