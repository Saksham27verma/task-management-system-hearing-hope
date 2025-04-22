import mongoose, { Schema } from 'mongoose';
import { RESOURCES, ACTIONS, Resource, Action, ROLE_PERMISSIONS } from '@/types/permissions';

// Re-export ROLE_PERMISSIONS for backward compatibility
export { ROLE_PERMISSIONS };

// Schema for permission group (for custom permission sets beyond roles)
const PermissionGroupSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    required: false
  },
  permissions: {
    type: [String],
    required: true,
    validate: {
      validator: function(perms: string[]) {
        // Validate each permission is in the format "resource:action"
        return perms.every((permission: string) => {
          const [resource, action] = permission.split(':');
          return (
            Object.values(RESOURCES).includes(resource as Resource) &&
            Object.values(ACTIONS).includes(action as Action)
          );
        });
      },
      message: 'Invalid permission format'
    }
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Create or retrieve the model
const PermissionGroup = mongoose.models.PermissionGroup || 
  mongoose.model('PermissionGroup', PermissionGroupSchema);

export default PermissionGroup; 