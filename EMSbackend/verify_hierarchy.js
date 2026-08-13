import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ems')
  .then(async () => {
    const users = await User.find({})
      .select("name designation profileImage employeeId reportingTo role")
      .lean();

    const userMap = {};
    users.forEach(user => {
      userMap[user._id.toString()] = { ...user, children: [] };
    });

    const rootNodes = [];
    users.forEach(user => {
      const node = userMap[user._id.toString()];
      if (user.reportingTo && userMap[user.reportingTo.toString()]) {
        userMap[user.reportingTo.toString()].children.push(node);
      } else {
        rootNodes.push(node);
      }
    });

    const ceoIndex = rootNodes.findIndex(node => 
      node.designation?.toUpperCase().includes("CEO") || 
      (node.role === "admin" && node.name?.toLowerCase().includes("suman"))
    );

    if (ceoIndex !== -1 && rootNodes.length > 1) {
      const ceoNode = rootNodes[ceoIndex];
      const otherRoots = rootNodes.filter((_, i) => i !== ceoIndex);
      console.log(`CEO found: ${ceoNode.name}. Nesting ${otherRoots.length} other roots under them.`);
      ceoNode.children.push(...otherRoots);
      console.log(`Final single root tree has ${ceoNode.children.length} total top-level children.`);
    } else if (ceoIndex !== -1) {
      console.log(`CEO found: ${rootNodes[0].name}. They are the only root.`);
    } else {
      console.log(`No CEO found among ${rootNodes.length} roots.`);
    }
    process.exit();
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
