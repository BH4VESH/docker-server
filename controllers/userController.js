const User = require('../models/userModel');
const deleteImage = require('../middleware/deleteImage');
const country = require('../models/countryModel');
const dotenv=require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SK);

exports.createUser = async (req, res) => {
  try {

    const { countryId, username, email, phone } = req.body;
    const profilePic = req.file.filename;
    const imagePath = `../public/uploads/userProfilePic/${profilePic}`;

    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });

    if (existingUser) {
      let errorMessage = '';

      if (existingUser.email === email) {
        errorMessage = 'Email is already in use. Please choose a different one.';
        deleteImage(imagePath);
      } else if (existingUser.phone === phone) {
        errorMessage = 'Phone number is already in use. Please choose a different one.';
        deleteImage(imagePath);
      }

      return res.json({ success: false, message: errorMessage });
    }

    const newUser = new User({
      profilePic,
      countryId,
      username,
      email,
      phone
    });

    const savedUser = await newUser.save();

    // //////////////////////////strip create costomer/////////////////
    const customer = await stripe.customers.create({
      email: email,
      name: username
    });

    savedUser.stripeCustomerId = customer.id;
    await savedUser.save();
    // //////////////////////////strip create costomer/////////////////
    const user = await User.aggregate([
      {
        $match: {
          _id: savedUser._id
        }
      },
      {
        $lookup: {
          from: "countries",
          localField: "countryId",
          foreignField: "_id",
          as: "code",
        },
      },
      {
        $unwind: {
          path: "$code",
        },
      },
      {
        $project: {
          _id: 1,
          countryId: 1,
          profilePic: 1,
          username: 1,
          email: 1,
          phone: 1,
          countryCode: "$code.country_calling_code",
        },
      },

    ])

    res.status(201).json({ success: true, message: "User created successfully", user: user[0], customerId: customer.id });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ///////////////////////////////get user data
exports.getUser = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;

  try {
    const users = await User.aggregate([
      {
        $lookup: {
          from: "countries",
          localField: "countryId",
          foreignField: "_id",
          as: "code",
        },
      },
      {
        $unwind: {
          path: "$code",
        },
      },
      {
        $project: {
          _id: 1,
          countryId: 1,
          profilePic: 1,
          username: 1,
          email: 1,
          phone: 1,
          stripeCustomerId: 1,
          countryCode: "$code.country_calling_code",
        },
      },
      {
        $skip: (page - 1) * limit
      },
      {
        $limit: limit
      }

    ])
    const totalItems = await User.countDocuments();

    res.json({ success: true, users, totalItems }); 
  } catch (error) {
    console.error('Error getting users for pagination:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

exports.getShortUser = async (req, res) => {
  try {
    const { page = 1, limit = 5, sortBy = 'username', sortOrder = 'asc' } = req.query;

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const users = await User.aggregate([
      {
        $lookup: {
          from: "countries",
          localField: "countryId",
          foreignField: "_id",
          as: "code",
        },
      },
      {
        $unwind: {
          path: "$code",
        },
      },
      {
        $project: {
          _id: 1,
          countryId: 1,
          profilePic: 1,
          username: 1,
          email: 1,
          phone: 1,
          stripeCustomerId: 1,
          countryCode: "$code.country_calling_code",
        },
      },
      {
        $sort: sortOptions
      },
      {
        $skip: ((parseInt(page - 1)) * parseInt(limit))
      },
      {
        $limit: parseInt(limit)
      }

    ])

    const totalUsers = await User.countDocuments();

    res.json({
      success: true,
      users,
      totalPages: Math.ceil(totalUsers / limit),
      totalItems: totalUsers
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
};
// /////////////////////////////////delete
exports.deleteUser = async (req, res) => {
  const id = req.params.id; 

  try {
    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const stripeCustomerId = deletedUser.stripeCustomerId;
    if (stripeCustomerId) {
      await stripe.customers.del(stripeCustomerId);
    }
    const imagePath = `../public/uploads/userProfilePic/${deletedUser.profilePic}`;
    deleteImage(imagePath);
    res.json({ success: true, message: 'User deleted successfully', deletedUser });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
// //////////////////////////update logic
exports.updateUser = async (req, res) => {
  const userId = req.params.id;

  try {
    const { username, email, countryId, phone } = req.body;
    let updatedFields = {};
    if (username) updatedFields.username = username;
    if (email) updatedFields.email = email;
    if (countryId) updatedFields.countryId = countryId;
    if (phone) updatedFields.phone = phone;

    if (req.file) {
      updatedFields.profilePic = req.file.filename;
    }

    const oldUser = await User.findById(userId);
    

    if (req.file && oldUser.profilePic) {
      const imagePath = `../public/uploads/userProfilePic/${oldUser.profilePic}`;
      deleteImage(imagePath);
    }
    const updatedUser = await User.findByIdAndUpdate(userId, updatedFields, { new: true });

    const user = await User.aggregate([
      {
        $match: {
          _id: updatedUser._id
        }
      },
      {
        $lookup: {
          from: "countries",
          localField: "countryId",
          foreignField: "_id",
          as: "code",
        },
      },
      {
        $unwind: {
          path: "$code",
        },
      },
      {
        $project: {
          _id: 1,
          countryId: 1,
          profilePic: 1,
          username: 1,
          email: 1,
          phone: 1,
          countryCode: "$code.country_calling_code",
        },
      },

    ])

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await stripe.customers.update(updatedUser.stripeCustomerId, {
      email: updatedUser.email,
    });
    
    res.json({ success: true, message: 'User updated successfully', user: user[0] });
  } catch (error) {
      if (error.code === 11000 && error.keyPattern && error.keyValue) {
        let errorMessage;
        if (error.keyPattern.phone) {
          errorMessage = `Phone number is already registered.`;
        } else if (error.keyPattern.email) {
          errorMessage = `Email is already registered.`;
        }
        res.status(500).json({ success: false, message: errorMessage });
      } else {
        console.error(error)
      }
  }
};

// Search users by username, email, or phone number
exports.searchUsers = async (req, res) => {
  const { query, page, pageSize } = req.query;
  const pageNumber = parseInt(page) || 1;
  const limit = parseInt(pageSize) || 10;

  try {
    const users = await User.aggregate([
      {
        $match: {
          $or: [
            { username: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } },
            { phone: { $regex: query, $options: 'i' } }
          ]
        },
      },
      {
        $lookup: {
          from: "countries",
          localField: "countryId",
          foreignField: "_id",
          as: "country"
        }
      },
    {
        $unwind: {
          path: "$country",
        },
      },
      {
        $project: {
          _id: 1,
          countryId: 1,
          profilePic: 1,
          username: 1,
          email: 1,
          phone: 1,
          countryCode: "$country.country_calling_code",
        },
      },
      {
        $skip: (pageNumber - 1) * limit
      },
      {
        $limit: limit
      }
    ]);

    const totalCount = await User.countDocuments({
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { phone: { $regex: query, $options: 'i' } }
      ]
    });

    res.json({ success: true, users, totalCount });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

//   payment card//////////////////////////////////////////////////

exports.addCard = async (req, res) => {
  try {
    const { CostomerId, token ,paymentMethodId} = req.body;
  // console.log("ADD CARD API------------- 4000000000000077",token);
//     const addFund = await stripe.charges.create({
//       amount:99999999,
//       currency: 'usd',
//       source: token,
//       description: 'Charge for adding funds to Stripe balance',
//     });
// console.log('addFund',addFund)
    const cardData = await stripe.customers.createSource(CostomerId, {
      source: token
    });

      // Attach the payment method to the customer
      // const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
      //   customer: CostomerId,
      // });
  
      // // Update the customer to set the default payment method
      // await stripe.customers.update(CostomerId, {
      //   invoice_settings: {
      //     default_payment_method: paymentMethodId,
      //   },
      // });

    res.status(200).json({ success: true, message: 'Card added successfully', cardData });
  } catch (error) {
    console.error('Failed to add card:', error);
    res.status(500).json({ success: false, error: 'Failed to add card' });
  }
};

exports.getCustomerCards = async (req, res) => {
  try {
    const { customerId } = req.params;
    const customer = await stripe.customers.retrieve(customerId);
    const cards = await stripe.customers.listSources(customerId, { object: 'card' });
    const defaultCardId = customer.default_source;
    res.status(200).json({ cards: cards.data, defaultCardId: defaultCardId });
  } catch (error) {
    console.error('Failed to retrieve cards:', error);
    res.status(500).json({ error: 'Failed to retrieve cards' });
  }
};

exports.setDefaultCard = async (req, res) => {
  try {
    const { customerId, cardId } = req.body;
    await stripe.customers.update(customerId, { default_source: cardId });
    res.status(200).json({ success: true, message: 'Default card set successfully' });
  } catch (error) {
    console.error('Failed to set default card:', error);
    res.status(500).json({ success: false, error: 'Failed to set default card' });
  }
};

exports.deleteCard = async (req, res) => {
  try {
    const { customerId, cardId } = req.params;
    await stripe.customers.deleteSource(customerId, cardId);
    res.status(200).json({ success: true, message: 'Card deleted successfully' });
  } catch (error) {
    console.error('Failed to delete card:', error);
    res.status(500).json({ success: false, error: 'Failed to delete card' });
  }
};