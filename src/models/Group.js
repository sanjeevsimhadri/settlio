const mongoose = require('mongoose');

// Define member schema for embedded documents
const memberSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Member email is required'],
    lowercase: true,
    trim: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null  // null if user hasn't registered yet
  },
  fullName: {
    type: String,
    trim: true,
    default: null  // populated when user registers or manually set
  },
  status: {
    type: String,
    enum: ['invited', 'active'],
    default: 'invited'
  },
  invitedAt: {
    type: Date,
    default: Date.now
  },
  joinedAt: {
    type: Date,
    default: null
  }
}, { _id: true });

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Group name is required'],
    trim: true,
    minlength: [2, 'Group name must be at least 2 characters long'],
    maxlength: [100, 'Group name cannot exceed 100 characters']
  },
  members: [memberSchema],
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Group admin is required']
  },
  currency: {
    type: String,
    default: 'INR',
    trim: true,
    uppercase: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
groupSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Ensure admin is included in members array
groupSchema.pre('save', function(next) {
  if (this.admin) {
    const adminExists = this.members.some(member => 
      member.userId && member.userId.toString() === this.admin.toString()
    );
    
    if (!adminExists) {
      // Add admin as active member if not already present
      this.members.push({
        email: '', // Will be populated from User document
        userId: this.admin,
        status: 'active',
        joinedAt: new Date()
      });
    }
  }
  next();
});

// Validation: At least one member is required
groupSchema.pre('save', function(next) {
  if (!this.members || this.members.length === 0) {
    const error = new Error('Group must have at least one member');
    error.name = 'ValidationError';
    return next(error);
  }
  next();
});

// Instance method to add member by email
groupSchema.methods.addMemberByEmail = function(email, userId = null) {
  // Check if member with this email already exists
  const existingMember = this.members.find(member => member.email === email.toLowerCase());
  
  if (existingMember) {
    // Update existing member if userId provided and not already set
    if (userId && !existingMember.userId) {
      existingMember.userId = userId;
      existingMember.status = 'active';
      existingMember.joinedAt = new Date();
    }
    return this;
  }
  
  // Add new member
  this.members.push({
    email: email.toLowerCase(),
    userId: userId,
    status: userId ? 'active' : 'invited',
    joinedAt: userId ? new Date() : null
  });
  
  this.updatedAt = Date.now();
  return this;
};

// Instance method to remove member by email or userId
groupSchema.methods.removeMember = function(identifier) {
  // Don't allow removing the admin
  if (this.admin.toString() === identifier.toString()) {
    throw new Error('Cannot remove group admin. Transfer admin rights first.');
  }
  
  // Remove by userId or email
  this.members = this.members.filter(member => {
    if (member.userId && member.userId.toString() === identifier.toString()) {
      return false;
    }
    if (member.email === identifier.toLowerCase()) {
      return false;
    }
    return true;
  });
  
  this.updatedAt = Date.now();
  return this;
};

// Instance method to check if user is member (by userId)
groupSchema.methods.isMember = function(userId) {
  return this.members.some(member => 
    member.userId && member.userId.toString() === userId.toString()
  );
};

// Backwards compatible alias (older code may call isMemberByUserId)
groupSchema.methods.isMemberByUserId = function(userId) {
  if (!userId) return false;
  return this.members.some(member => member.userId && member.userId.toString() === userId.toString());
};

// Instance method to check if email is member
groupSchema.methods.isMemberByEmail = function(email) {
  return this.members.some(member => member.email === email.toLowerCase());
};

// Remove member by userId helper used by controllers
groupSchema.methods.removeMemberByUserId = function(userId) {
  if (!userId) return this;
  // Prevent removing admin
  if (this.admin && this.admin.toString() === userId.toString()) {
    throw new Error('Cannot remove group admin. Transfer admin rights first.');
  }
  this.members = this.members.filter(m => !(m.userId && m.userId.toString() === userId.toString()));
  this.updatedAt = Date.now();
  return this;
};

// Instance method to get member by email
groupSchema.methods.getMemberByEmail = function(email) {
  return this.members.find(member => member.email === email.toLowerCase());
};

// Instance method to activate member (when they register)
groupSchema.methods.activateMember = function(email, userId) {
  const member = this.getMemberByEmail(email);
  if (member && !member.userId) {
    member.userId = userId;
    member.status = 'active';
    member.joinedAt = new Date();
    this.updatedAt = Date.now();
    return true;
  }
  return false;
};

// Instance method to check if user is admin
groupSchema.methods.isAdmin = function(userId) {
  return this.admin.toString() === userId.toString();
};

// Create indexes for better performance
groupSchema.index({ admin: 1 });
groupSchema.index({ 'members.userId': 1 });
groupSchema.index({ 'members.email': 1 });
groupSchema.index({ 'members.status': 1 });
groupSchema.index({ name: 1 });
groupSchema.index({ createdAt: -1 });
groupSchema.index({ 'members.userId': 1, 'createdAt': -1 }); // Compound index for user's groups
groupSchema.index({ 'members.email': 1, 'members.status': 1 }); // For finding pending invitations

// Virtual for member count
groupSchema.virtual('memberCount').get(function() {
  return this.members ? this.members.length : 0;
});

// Virtual for active member count
groupSchema.virtual('activeMemberCount').get(function() {
  return this.members ? this.members.filter(member => member.status === 'active').length : 0;
});

// Virtual for invited member count
groupSchema.virtual('invitedMemberCount').get(function() {
  return this.members ? this.members.filter(member => member.status === 'invited').length : 0;
});

// Ensure virtual fields are serialized
groupSchema.set('toJSON', { virtuals: true });
groupSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Group', groupSchema);