const { Creator } = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const HttpStatus = require('../enums/httpStatusCode.enum');
const ResponseMessages = require('../enums/responseMessages.enum');

const creatorController = {};

//creator register
creatorController.register = async (req, res) => {
    try {
        const { username, email, phoneNumber, password, confirmPassword } = req.body;

        // Validate required fields
        if (!username || !email || !phoneNumber || !password || !confirmPassword) {
            return res.error(
                HttpStatus.BAD_REQUEST,
                false,
                "All fields are required"
            );
        }

        // Validate password match
        if (password !== confirmPassword) {
            return res.error(
                HttpStatus.BAD_REQUEST,
                false,
                "Passwords do not match"
            );
        }

        // Check if creator with email already exists
        const existingCreator = await Creator.findOne({ where: { email } });
        if (existingCreator) {
            return res.error(
                HttpStatus.CONFLICT,
                false,
                "Creator with this email already exists"
            );
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new creator
        const newCreator = await Creator.create({
            username,
            email,
            phoneNumber,
            password: hashedPassword
        });

        // Remove password from response
        const creatorResponse = newCreator.toJSON();
        delete creatorResponse.password;

        // Generate JWT token
        const token = jwt.sign(
            { 
                id: newCreator.id, 
                username: newCreator.username 
            },
            process.env.APP_SUPER_SECRET_KEY,
            { expiresIn: '24h' }
        );

        return res.success(
            HttpStatus.CREATED,
            true,
            ResponseMessages.SAVE,
            {
                creator: creatorResponse,
                token
            }
        );

    } catch (error) {
        console.error('Creator registration error:', error);
        return res.error(
            HttpStatus.INTERNAL_SERVER_ERROR,
            false,
            "Error registering creator",
            error
        );
    }
};

//creator login
creatorController.login = async (req, res) => {
    try {
        const { mobileNo, password } = req.body;

        // Validate required fields
        if (!mobileNo || !password) {
            return res.error(
                HttpStatus.BAD_REQUEST,
                false,
                "Mobile number and password are required"
            );
        }

        // Find creator by mobile number
        const creator = await Creator.findOne({ 
            where: { phoneNumber: mobileNo },
            attributes: ['id', 'username', 'email', 'phoneNumber', 'password', 'status']
        });

        if (!creator) {
            return res.error(
                HttpStatus.UNAUTHORIZED,
                false,
                "Invalid mobile number or password"
            );
        }

        // Check if creator account is active
        if (creator.status !== 'active') {
            return res.error(
                HttpStatus.FORBIDDEN,
                false,
                "Your account is not active. Please contact administrator."
            );
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, creator.password);
        
        if (!isValidPassword) {
            return res.error(
                HttpStatus.UNAUTHORIZED,
                false,
                "Invalid mobile number or password"
            );
        }

        // Generate JWT token
        const token = jwt.sign(
            { 
                id: creator.id, 
                username: creator.username
            },
            process.env.APP_SUPER_SECRET_KEY,
            { expiresIn: '24h' }
        );

        // Remove password from response
        const creatorResponse = creator.toJSON();
        delete creatorResponse.password;

        return res.success(
            HttpStatus.OK,
            true,
            "Login successful",
            { 
                creator: creatorResponse,
                token
            }
        );

    } catch (error) {
        console.error('Creator login error:', error);
        return res.error(
            HttpStatus.INTERNAL_SERVER_ERROR,
            false,
            "Error during login",
            error
        );
    }
};

module.exports = creatorController;