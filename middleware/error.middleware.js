const errorMiddleware = (err, req, res, next) => {
    // fallback --if we forget something in the controller
    err.statusCode = err.statusCode || 500;
    err.message = err.message || "Something went wrong"; // if message or status code is given, then OK, else use 500 or "Something went wrong"
    
    return res.status(err.statusCode).json({
        success: false,
        message: err.message, // the error message from the middleware
        stack: err.stack // the error stack trace
    });
};

export default errorMiddleware;
