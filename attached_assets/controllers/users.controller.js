import UsersCoordinator from '../coordinators/users.coordinator.js';

export default class UsersController {
    static createUser = async (req, res, next) => {
        try {
            // console.log('Create User Request Body:', req.body);
            const user = req.body;
            const result = await UsersCoordinator.createUser(req.params.organizationID, user);
            // console.log('User Created:', result);
            res.status(201).json(result);
        } catch (error) {
            console.error('Error Creating User:', error);
            next(error);
        }
    };

    static getUsers = async (req, res, next) => {
        try {
            // console.log('Fetching Users for Organization:', req.params.organizationID);
            const users = await UsersCoordinator.getUsers(req.params.organizationID);
            // console.log('Users Fetched:', users);
            res.status(200).json(users);
        } catch (error) {
            console.error('Error Fetching Users:', error);
            next(error);
        }
    };

    static getUser = async (req, res, next) => {
        try {
            // console.log('Fetching User:', req.params.username, 'for Organization:', req.params.organizationID);
            const user = await UsersCoordinator.findUserByUsername(req.params.organizationID, req.params.username);
            if (!user) {
                // console.log('User Not Found:', req.params.username);
                res.status(404).json({ message: 'User not found' });
            } else {
                // console.log('User Fetched:', user);
                res.status(200).json(user);
            }
        } catch (error) {
            console.error('Error Fetching User:', error);
            next(error);
        }
    };

    static updateUser = async (req, res, next) => {
        try {
            // console.log('Update User Request for:', req.params.username, 'in Organization:', req.params.organizationID);
            // console.log('Update Data:', req.body);
            const update = req.body;
            const result = await UsersCoordinator.updateUser(req.params.organizationID, req.params.username, update);
            // console.log('User Updated:', result);
            res.status(200).json(result);
        } catch (error) {
            console.error('Error Updating User:', error);
            next(error);
        }
    };

    static deleteUser = async (req, res, next) => {
        try {
            // console.log('Delete User Request for:', req.params.username, 'in Organization:', req.params.organizationID);
            const result = await UsersCoordinator.deleteUser(req.params.organizationID, req.params.username);
            // console.log('User Deleted:', result);
            res.status(200).json(result);
        } catch (error) {
            console.error('Error Deleting User:', error);
            next(error);
        }
    };
};
