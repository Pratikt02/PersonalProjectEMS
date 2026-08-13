import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ems')
  .then(async () => {
    const roots = await User.find({ reportingTo: null });
    console.log(`Roots found: ${roots.length}`);
    roots.forEach(r => console.log(`- ${r.name} (${r.designation}) [${r.role}]`));
    process.exit();
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
