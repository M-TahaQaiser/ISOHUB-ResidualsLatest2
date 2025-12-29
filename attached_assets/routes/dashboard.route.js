import { Router } from 'express';
import DashboardController from '../controllers/dashboard.controller.js'

const dashboardRoute = Router();

dashboardRoute.get('/organizations/:organizationID/needs-approval', DashboardController.getNeedsApproval);

export default dashboardRoute;