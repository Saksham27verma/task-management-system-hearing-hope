import mongoose, { Schema, Document } from 'mongoose';

export interface ISocialLink {
  platform: string;
  url: string;
}

export interface ICompany extends Document {
  name: string;
  description: string;
  address: string;
  email: string;
  phone: string;
  website: string;
  logoUrl?: string;
  socialLinks: ISocialLink[];
}

const SocialLinkSchema = new Schema<ISocialLink>({
  platform: {
    type: String,
    required: true,
    trim: true,
  },
  url: {
    type: String,
    required: true,
    trim: true,
  },
});

const CompanySchema = new Schema<ICompany>(
  {
    name: {
      type: String,
      required: [true, 'Please provide company name'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please provide company description'],
    },
    address: {
      type: String,
      required: [true, 'Please provide company address'],
    },
    email: {
      type: String,
      required: [true, 'Please provide company email'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Please provide company phone number'],
    },
    website: {
      type: String,
      required: [true, 'Please provide company website'],
      trim: true,
    },
    logoUrl: {
      type: String,
    },
    socialLinks: [SocialLinkSchema],
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Company || mongoose.model<ICompany>('Company', CompanySchema); 