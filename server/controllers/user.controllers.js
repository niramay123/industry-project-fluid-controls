import {User} from '../models/user.models.js'
import { Task } from '../models/task.models.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import {sendForgotMail, sendMail} from '../middlewares/sendMail.middlewares.js'

export const registerUser = async (req,res)=>{
    try {

        const {email,name,password,role} = req.body;

        let user = await User.findOne({email});

        if(user){
            return res.status(400).json({
                message:"User already exists"
            })
        };

        const hashPassword = await bcrypt.hash(password, 10);

        user = {
            email,
            name,
            password:hashPassword,
            role
        };

        // otp generation
        const otp = Math.floor(Math.random()*1000000);

        const activationToken = jwt.sign(
            {
                user,
                otp
            },
            process.env.ACTIVATION_SECRET,
            {
                expiresIn:'5m'
            }
        );


        const data = {
            name,
            otp
        };

        await sendMail(email,"FluidControls otp verification",data);

        res.status(200).json({
            message:"Otp sent to your mail",
            activationToken,
        })
        
    } catch (error) {
        res.status(500).json({
            message:error.message
        })
    }
}

export const verifyOtp = async (req,res)=>{

   try {
     const { activationToken,  otp } = req.body;
 
     const verify = jwt.verify(activationToken, process.env.ACTIVATION_SECRET);

     console.log(verify.data);
     
     if(!verify)
     {
         return res.status(400).json({
             message:"otp expired!"
         })
     }
 
     if(String(verify.otp) !==String(otp))
     {
         return res.status(400).json({
             message:"otp is invalid"
         })
     };
 
     await User.create({
         name: verify.user.name,
         email:verify.user.email,
         password:verify.user.password,
         role:verify.user.role
     });
 
     res.status(200).json({
         message:"User registered successfully",
     })
   } catch (error) {
    res.status(500).json({
        message:error.message,
    })
   }
}

export const loginUser = async (req,res)=>{
    try {

        const {email, password} = req.body;

        if(!email || !password)
        {
            res.status(400).json({
                message:"It is required to enter."
            });
        }

        const user = await User.findOne({email});

        if(!user)
        {
            res.status(400).json({
                message:"User not found",
            })
        }

        const verifyPassword = bcrypt.compare(password,user.password);

        if(!verifyPassword)
        {
            res.status(400).json({
                message:"Password is Incorrect",
            })
        }


        const token = jwt.sign(
            {
                _id: user._id,
            },
            process.env.JWT_SECRET,
            {
                expiresIn:"15d"
            }
        )

        res.status(200).json({
            message:`Welcome back ${user.name}`,
            token,
            user,
        });
        
    } catch (error) {
        res.status(500).json({
            message:error.message
        })
    }
}

export const getMyProfile =async(req,res)=>{
    try {
        const user = await User.findOne(req.user._id);
        res.json({user});

        if(!user) return res.json({message:"User not found."})

    } catch (error) {
        res.status(400).json({
            message:error.message
        })
    }
}

export const updateMyProfile = async (req,res)=>{
    try {

        const {email,name} = req.body;
        const updateFields = {};

        if (name) updateFields.name = name;
        if (email) updateFields.email = email;

        const user = await User.findByIdAndUpdate(
            req.user.id, 
            updateFields,
            {new: true}// gives updated user
        );

        res.json({user});   

    } catch (error) {
         res.status(400).json({
            message:error.message
        })
    }
}


export const updateProfilePic = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const imagePath = `/uploads/${req.file.filename}`;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { profilePicture: imagePath },
      { new: true }
    ).select('-password');

    res.json({ message: 'Profile picture updated', user });

  } catch (error) {
    res.status(400).json({
      message: error.message
    });
  }
};

export const forgotPassword =async(req,res)=>{
    try {
        const {email} =req.body;
    
        const user = await User.findOne({email});
    
        if(!user) return res.status(400).json({message: "No user with this email"});
    
        const token = jwt.sign({email}, process.env.FORGOT_SECRET);
    
        const data = {email,token};
    
        await sendForgotMail("Fluid Controls- Reset Password ",data);
    
        user.resetPasswordExpired = Date.now() + 5*60*1000;
    
        await user.save();
    
        res.json({message:"Reset password link is send to your mail"})
    } catch (error) {
        res.status(400).json({
      message: error.message
    });
    }
}

export const getAllOperators = async (req, res) => {
  try {
    const operators = await User.find(
      { role: /^operator$/i },
      { password: 0 }
    ).lean();

    if (!operators.length) {
      return res.status(200).json({ success: true, operators: [] });
    }

    const operatorIds = operators.map(op => op._id);

    const taskCounts = await Task.aggregate([
      {
        $match: { 
          assignedTo: { $in: operatorIds },
          status: { $ne: "Completed" }
        }
      },
      { $unwind: "$assignedTo" },
      {
        $group: {
          _id: "$assignedTo",
          totalTasks: { $sum: 1 }
        }
      }
    ]);

    const countMap = {};
    taskCounts.forEach(tc => {
      countMap[tc._id.toString()] = tc.totalTasks;
    });

    const result = operators.map(op => {
      const totalTasks = countMap[op._id.toString()] || 0;

      return {
        _id: op._id,
        name: op.name,
        email: op.email,
        totalTasks,
        availability: totalTasks >= 3 ? "Busy" : "Available",
      };
    });

    res.status(200).json({ success: true, operators: result });

  } catch (error) {
    console.error("getAllOperators error:", error);
    res.status(500).json({ success: false, message: "Internal error" });
  }
};

