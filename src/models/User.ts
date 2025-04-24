import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import { Permission, ROLE_PERMISSIONS } from '@/types/permissions';

export type UserRole = 'SUPER_ADMIN' | 'MANAGER' | 'EMPLOYEE';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone: string;
  position: string;
  isActive: boolean;
  lastLogin?: Date;
  customPermissions?: string[]; // Array of custom permissions beyond role
  permissionGroups?: mongoose.Types.ObjectId[]; // References to permission groups
  comparePassword(candidatePassword: string): Promise<boolean>;
  hasPermission(permission: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 6,
    },
    role: {
      type: String,
      enum: ['SUPER_ADMIN', 'MANAGER', 'EMPLOYEE'],
      default: 'EMPLOYEE',
    },
    phone: {
      type: String,
      required: [true, 'Please provide a phone number'],
    },
    position: {
      type: String,
      required: [true, 'Please provide a job position'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
    customPermissions: {
      type: [String],
      default: [],
    },
    permissionGroups: [{
      type: Schema.Types.ObjectId,
      ref: 'PermissionGroup',
    }],
  },
  {
    timestamps: true,
  }
);

// Hash the password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to check if user has a permission
UserSchema.methods.hasPermission = async function (permission: string): Promise<boolean> {
  // Check role-based permissions first
  const rolePermissions = ROLE_PERMISSIONS[this.role as keyof typeof ROLE_PERMISSIONS] || [];
  if ((rolePermissions as readonly string[]).includes(permission)) {
    return true;
  }
  
  // Check custom permissions
  if (this.customPermissions && this.customPermissions.includes(permission)) {
    return true;
  }
  
  // Check permissions from permission groups
  if (this.permissionGroups && this.permissionGroups.length > 0) {
    const populatedUser = await this.populate('permissionGroups');
    
    for (const group of populatedUser.permissionGroups) {
      if (group.permissions && group.permissions.includes(permission)) {
        return true;
      }
    }
  }
  
  return false;
};

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema); 