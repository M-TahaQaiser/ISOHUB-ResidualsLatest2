// [efd]/coordinators/auth.coordinator.js
import bcrypt from 'bcryptjs';
import AuthM from '../models/auth.model.js';
import User from '../classes/user.class.js';


export default class AuthCoordinator {

    static loginUser = async (username, password) => {
        const user = await AuthM.findUserByUsername(username.toLowerCase());
        // console.log(user);
        if (!user) throw new Error('User not found');

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) throw new Error('Invalid credentials');

        if (user.status !== 'active') throw new Error('User is not active, contact support to activate your account');

        return user;
    }

    static addUser = async (userData) => {
        try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(userData.password, salt);
        const newUser = new User(
            userData.organization,
            userData.fName,
            userData.lName,
            userData.email,
            userData.username.toLowerCase(),
            hashedPassword
        );
        const result = await AuthM.addUser(newUser);
        return result;
        } catch (error) {
            console.error('Error creating user: ' + error.message);
            return error;
        }
    }
};

