import mongoose from 'mongoose';
const { Schema } = mongoose;

const seriesSchema = new Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        slug: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        type: {
            type: String,
            enum: ["anime", "manga", "game", "light_novel", "other"],
            default: "anime",
        },
    },
    { timestamps: true },
)

export const Series = mongoose.model("Series", seriesSchema);