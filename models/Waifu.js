import mongoose from 'mongoose';

const mediaItemSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    type: { type: String, enum: ["image", "video"], required: true },
    uploaded_by: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { _id: true }
);

const waifuSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        series_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Series",
            required: true,
            index: true,
        },
        series: {
            type: String,
            required: true,
            trim: true,
        },
        tags: {
            type: [String],
            default: []
        },
        media: {
          type: [mediaItemSchema],
          validate: {
            validator: (arr) => Array.isArray(arr) && arr.length > 0,
            message: "At least one image or video required",
          },
        },
        claims_count: {
            type: Number,
            default: 0,
            min: 0,
            index: true,
        },
        created_by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        deleted_at: {
            type: Date,
            default: null,
            index: true,
        },
    },
    {
        timestamps: true
    },
)

waifuSchema.index(
    { name: 1, series_id: 1 },
    {
        unique: true,
        partialFilterExpression: { deleted_at: null },
        collation: { locale: "en", strength: 2 },
    }
);

waifuSchema.pre(/^(find|countDocuments)/, function () {
    if (!this.getOptions().includeDeleted) {
        this.where({ deleted_at: null });
    }
});

waifuSchema.pre("aggregate", function () {
    if (!this.options?.includeDeleted) {
        this.pipeline().unshift({ $match: { deleted_at: null } });
    }
});

export const Waifu = mongoose.model("Waifu", waifuSchema);
