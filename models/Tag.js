import mongoose from "mongoose";

const tagSchema = new mongoose.Schema(
    {
        slug: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        label: {
            type: String,
            required: true,
            trim: true,
        },
        aliases: {
            type: [String],
            default: []
        },
        usage_count: {
            type: Number,
            default: 0,
            min: 0,
        },
        created_by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        deleted_at: {
            type: Date,
            default: null,
            index: true,
        },
    },
    { timestamps: true }
);

tagSchema.pre(/^(find|countDocuments)/, function () {
    if (!this.getOptions().includeDeleted) {
        this.where({ deleted_at: null });
    }
});

export const Tag = mongoose.model("Tag", tagSchema);