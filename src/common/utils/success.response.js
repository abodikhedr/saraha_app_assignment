



export const success_response=({
    res,
    statusCode,
    message="done",
    data=undefined
}={})=>{
    return res.status(statusCode || 200).json({message,data})
}