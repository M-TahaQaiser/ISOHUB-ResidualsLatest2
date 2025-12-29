import { Router } from 'express';
import UsersController from '../controllers/users.controller.js'

const usersRouter = Router();


usersRouter.get('/organizations/:organizationID', UsersController.getUsers);
usersRouter.get('/organizations/:organizationID/:username', UsersController.getUser);
usersRouter.post('/organizations/:organizationID', UsersController.createUser);
usersRouter.put('/organizations/:organizationID/:username', UsersController.updateUser);
usersRouter.delete('/organizations/:organizationID/:username', UsersController.deleteUser);

export default usersRouter;