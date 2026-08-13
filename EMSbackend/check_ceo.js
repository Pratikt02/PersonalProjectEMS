import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ems')
  .then(async () => {
    const ceo = await User.findOne({ designation: /CEO/i });
    if (ceo) {
      console.log(`CEO Found: ${ceo.name} (${ceo.designation})`);
    } else {
      const roots = await User.find({ reportingTo: null });
      console.log(`Roots found: ${roots.length}`);
      roots.forEach(r => console.log(`- ${r.name} (${r.designation})`));
    }
    process.exit();
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
