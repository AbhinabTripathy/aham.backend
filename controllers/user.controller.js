const { User,GraphicNovel,Audiobook,AudiobookEpisode,GraphicNovelEpisode } = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const HttpStatus = require('../enums/httpStatusCode.enum');
const ResponseMessages = require('../enums/responseMessages.enum');

const userController = {};

// User Registration
userController.register = async (req, res) => {
    try {
        const { name, email, mobileNumber, password, confirmPassword } = req.body;

        // Validate required fields
        if (!name || !email || !mobileNumber || !password || !confirmPassword) {
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

        // Check if user with email or mobile already exists
        const existingUser = await User.findOne({
            where: { email } // you can add `OR` mobile check here if needed
        });

        if (existingUser) {
            return res.error(
                HttpStatus.CONFLICT,
                false,
                "User with this email already exists"
            );
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const newUser = await User.create({
            name,
            email,
            mobileNumber,
            password: hashedPassword
        });

        // Remove password from response
        const userResponse = newUser.toJSON();
        delete userResponse.password;

        // Generate JWT token
        const token = jwt.sign(
            { 
                id: newUser.id, 
                name: newUser.name,
                role: 'user' 
            },
            process.env.APP_SUPER_SECRET_KEY,
            { expiresIn: '24h' }
        );

        return res.success(
            HttpStatus.CREATED,
            true,
            ResponseMessages.SAVE,
            {
                user: userResponse,
                token
            }
        );

    } catch (error) {
        console.error('User registration error:', error);
        return res.error(
            HttpStatus.INTERNAL_SERVER_ERROR,
            false,
            "Error registering user",
            error
        );
    }
};
// User login
userController.login = async (req, res) => {
  try {
    const { mobileNumber, password } = req.body;

    // Validate input
    if (!mobileNumber || !password) {
      return res.error(
        HttpStatus.BAD_REQUEST,
        false,
        "Mobile number and password are required"
      );
    }

    // Find user by mobile number
    const user = await User.findOne({
      where: { mobileNumber }
    });

    if (!user) {
      return res.error(
        HttpStatus.UNAUTHORIZED,
        false,
        "Invalid mobile number or password"
      );
    }

    // Compare password hash
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.error(
        HttpStatus.UNAUTHORIZED,
        false,
        "Invalid mobile number or password"
      );
    }

    // Remove password from response object
    const userResponse = user.toJSON();
    delete userResponse.password;

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        role: 'user'
      },
      process.env.APP_SUPER_SECRET_KEY,
      { expiresIn: '24h' }
    );

    return res.success(
      HttpStatus.OK,
      true,
      "Login successful",
      {
        user: userResponse,
        token
      }
    );

  } catch (error) {
    console.error("User login error:", error);
    return res.error(
      HttpStatus.INTERNAL_SERVER_ERROR,
      false,
      "Error during login",
      error
    );
  }
};

// Get all published Graphic Novels and Audiobooks with episodes
userController.getPublishedContent = async (req, res) => {
  try {
    // Fetch published Graphic Novels with Episodes
    const graphicNovels = await GraphicNovel.findAll({
      where: { status: 'published' },
      include: [
        {
          model: GraphicNovelEpisode,
          as: 'episodes' // must match the alias in association
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Fetch published Audiobooks with Episodes
    const audiobooks = await Audiobook.findAll({
      where: { status: 'published' },
      include: [
        {
          model: AudiobookEpisode,
          as: 'episodes' // must match the alias in association
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    return res.success(
      HttpStatus.OK,
      true,
      "Published content fetched successfully",
      {
        graphicNovels,
        audiobooks
      }
    );

  } catch (error) {
    console.error("Error fetching published content:", error);
    return res.error(
      HttpStatus.INTERNAL_SERVER_ERROR,
      false,
      "Error fetching published content",
      error
    );
  }
};

 //Get only published Graphic Novels with episodes
userController.getPublishedGraphicNovels = async (req, res) => {
  try {
    const graphicNovels = await GraphicNovel.findAll({
      where: { status: 'published' },
      include: [
        {
          model: GraphicNovelEpisode,
          as: 'episodes'
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    return res.success(
      HttpStatus.OK,
      true,
      "Published Graphic Novels fetched successfully",
      graphicNovels
    );
  } catch (error) {
    console.error('Error fetching published graphic novels:', error);
    return res.error(
      HttpStatus.INTERNAL_SERVER_ERROR,
      false,
      "Error fetching published graphic novels",
      error
    );
  }
};

//get only published audio book with episodes
userController.getPublishedAudiobooks = async (req, res) => {
  try {
    const audiobooks = await Audiobook.findAll({
      where: { status: 'published' },
      include: [
        {
          model: AudiobookEpisode,
          as: 'episodes'
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    return res.success(
      HttpStatus.OK,
      true,
      "Published Audiobooks fetched successfully",
      audiobooks
    );
  } catch (error) {
    console.error('Error fetching published audiobooks:', error);
    return res.error(
      HttpStatus.INTERNAL_SERVER_ERROR,
      false,
      "Error fetching published audiobooks",
      error
    );
  }
};

// GET graphic-novel by  id............................

userController.getGraphicNovelById =async (req, res) => {
  try {
    const { id } = req.params;
    const graphicNovel = await GraphicNovel.findByPk(id, {
      include: [
        {
          model: GraphicNovelEpisode, 
          as: 'episodes' 
        }
      ]
    });

    if (!graphicNovel) {
      return res.status(404).json({ message: 'Graphic Novel not found' });
    }

    res.status(200).json({ graphicNovel });
  } catch (error) {
    console.error('Error fetching graphic novel:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};


// GET audiobook by id.............................

userController.getAudioBookById=async (req, res) => {
  try {
    const { id } = req.params;
    const audiobook = await Audiobook.findByPk(id, {
      include: [
        {
          model: AudiobookEpisode,
          as: 'episodes' 
        }
      ]
    });

    if (!audiobook) {
      return res.status(404).json({ message: 'Audiobook not found' });
    }

    res.status(200).json({ audiobook });
  } catch (error) {
    console.error('Error fetching audiobook:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

module.exports = userController;
