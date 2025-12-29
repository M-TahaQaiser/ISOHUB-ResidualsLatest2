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


export default class AuthM {

    static findUserByUsername = async (username) => {
        try {
            return await db.dbUsers().findOne({ username });
        } catch (error) {
            return error;
        }
    }

    static addUser = async (user) => {
        try {
            const dc = await dupeCheck(user.username);
            if (dc.isDupe) {
                return dc;
            } else {                
                const result = await db.dbUsers().insertOne(user);
                if (result.acknowledged) {
                    return await this.findUserByUsername(user.username);
                };
            };
        } catch (error) {
            throw new Error('Error adding user: ' + error.message);
        };
    };
};
