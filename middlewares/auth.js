import jwt from 'jsonwebtoken'
import { sendError } from "../utils/response.js"

const auth = (req, res, next) => {
    const header = req.header('Authorization')

    if(!header) {
        return sendError(res, 401, "No token, authorization denied!")
    }

    const token = header.startsWith("Bearer ") ? header.slice(7) : header

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        req.user = decoded
        next()
    } catch (err) {
        sendError(res, 401, "Token is not valid!")
    }
}

export default auth
