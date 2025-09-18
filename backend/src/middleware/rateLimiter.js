import ratelimit from "../config/upstash.js"

const rateLimiter = async (req,res,next) => {

    try{
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown'
        const key = `rl:${ip}:${req.method}:${req.path}`
        const {success} = await ratelimit.limit(key)

        if(!success){
            return res.status(429).json({
                message:"Too many requests, please try again later"
            })
        }

        next()

    }catch(error){

        console.log("rate limit error", error)
        next(error)

    }

}

export default rateLimiter