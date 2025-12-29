// if using mongodb
import { db } from '../lib/database.lib.js';
import Constants from '../lib/constants.lib.js';

const dupeCheck = async (email, username) => {
    try {
        const user = await db.dbUsers().findOne(
            { $or: [{ username }, { email }] },
            { projection: Constants.DEFAULT_PROJECTION }
        );

        if (user) {
            if (user.username === username) {
                return {
                    isDupe: true,
                    message: 'Username already exists'
                };
            } else if (user.email === email) {
                return {
                    isDupe: true,
                    message: 'Email already exists'
                };
            }
        } else {
            return {
                isDupe: false,
                message: 'Username and email are available'
            };
        }
    } catch (error) {
        return {
            isDupe: false,
            message: `Error occurred: ${error.message}`
        };
    }
}


export default class UsersModel {

    static addUser = async (user) => {
        try {
            const dc = await dupeCheck(user.email, user.username);
            if (dc.isDupe) {
                return dc;
            };
            return await db.dbUsers().insertOne(user);
        } catch (error) {
            console.error('Error creating user in DB: ', error);
            return error;
        }
    };

    static getUser = async (organizationID, username) => {
        try {
            return await db.dbUsers().findOne({ organizationID, username }, { projection: Constants.DEFAULT_PROJECTION });
        } catch (error) {
            console.error('Error getting user in DB: ', error);
            return error;
        }
    };

    static getUsers = async (organizationID) => {
        try {
            return await db.dbUsers().find({ organizationID }, { projection: Constants.DEFAULT_PROJECTION }).toArray();
        } catch (error) {
            console.error('Error getting users in DB: ', error);
            return error;
        }
    };

    static findUserByUsername = async (organizationID, username) => {
        try {
            return await db.dbUsers().findOne({ organizationID, username }, { projection: Constants.DEFAULT_PROJECTION });
        } catch (error) {
            console.error('Error finding user by username in DB: ', error);
            return error;
        }
    }

    static updateUser = async (organizationID, username, update) => {
        try {
            // Find the current user
            const currentUser = await db.dbUsers().findOne({ organizationID, username });
    
            if (!currentUser) {
                return {
                    success: false,
                    message: 'User not found'
                };
            }
    
            // Check if the username or email is being updated
            const isUsernameChanged = update.username && update.username !== currentUser.username;
            const isEmailChanged = update.email && update.email !== currentUser.email;
    
            // Perform the duplicate check only for the fields being changed
            if (isUsernameChanged) {
                const usernameCheck = await dupeCheck(null, update.username);
                if (usernameCheck.isDupe) {
                    return {
                        success: false,
                        message: 'Username is already taken'
                    };
                }
            }
    
            if (isEmailChanged) {
                const emailCheck = await dupeCheck(update.email, null);
                if (emailCheck.isDupe) {
                    return {
                        success: false,
                        message: 'Email is already in use'
                    };
                }
            }
    
            // Perform the update
            const result = await db.dbUsers().updateOne(
                { organizationID, username },
                { $set: update }
            );
    
            if (result.modifiedCount === 0) {
                return {
                    success: false,
                    message: 'No changes made'
                };
            }
    
            return {
                success: true,
                message: 'User updated successfully'
            };
        } catch (error) {
            console.error('Error updating user in DB: ', error);
            return {
                success: false,
                message: `Error updating user: ${error.message}`
            };
        }
    };
    
    

    static deleteUser = async (organizationID, username) => {
        try {
            return await db.dbUsers().deleteOne({ organizationID, username });
        } catch (error) {
            console.error('Error deleting user in DB: ', error);
            return error;
        }
    };

    static findOrganizationByID = async (organizationID) => {
        try {
            const result = await db.dbUsers().findOne({ organizationID });
            return result.organization;
        } catch (error) {
            console.error('Error finding organization by ID in DB: ', error);
            return error;
        };
    }
}