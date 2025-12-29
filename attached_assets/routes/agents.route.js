import { Router } from 'express';
import {
    createAgent,
    uploadAgents,
    getAgent,
    getAgents,
    updateAgent,
    deleteAgent,
    reauditAgents,
    getMerchantByID,
    getAgentByUserId,
} from '../controllers/agents.controller.js';
import multer from 'multer';

const agentsRoute = Router();

// Multer configuration
const fileFilter = (req, file, cb) => {
    const validTypes = [
        'text/csv', 
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // For .xlsx
    ];
    if (validTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only CSV, XLSX, and XLSM files are allowed.'), false);
    }
};

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // Adjust as necessary
    fileFilter: fileFilter
});

// Logging middleware
agentsRoute.use((req, res, next) => {
    // console.log(`Request received for path: ${req.path}`);
    next();
});

// Routes
// New route for re-audit
agentsRoute.post('/organizations/:organizationID/reaudit', reauditAgents);
agentsRoute.post('/organizations/:organizationID/batch', upload.single('agents'), uploadAgents);
agentsRoute.get('/organizations/:organizationID/:agentID', getAgent);
agentsRoute.patch('/organizations/:organizationID/:agentID', updateAgent);
agentsRoute.delete('/organizations/:organizationID/:agentID', deleteAgent);
agentsRoute.post('/organizations/:organizationID', createAgent);
agentsRoute.get('/organizations/:organizationID', getAgents);
agentsRoute.get('/organizations/:organizationID/merchants/:merchantID', getMerchantByID);
agentsRoute.get('/organizations/:organizationID/user/:userId', getAgentByUserId);

export default agentsRoute;
