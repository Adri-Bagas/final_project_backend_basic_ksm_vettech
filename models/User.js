import mongoose from 'mongoose';

const listItemSchema = new mongoose.Schema(
    {
        waifu_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Waifu",
            required: true,
        },
        note: { type: String, default: "", maxlength: 1000 },
        added_at: { type: Date, default: Date.now },
    },
    { _id: false }
);


const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            minlength: 3,
            maxlength: 30,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: true,
            select: false,
        },
        slug: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        list: {
            type: [listItemSchema],
            default: [],
        },
    },
    {
        timestamps: true
    },
);

export const User = mongoose.model("User", userSchema);
