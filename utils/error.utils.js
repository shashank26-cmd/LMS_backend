//This is instance of err this made to reduce the effort of writing again and again err json..
class AppError extends Error { 
constructor(message,statusCode){
    
    super(message); 
    this.statusCode=statusCode;
    Error.captureStackTrace(this,this.constructor) //(context,current controller) on which line error is there
}
}
export default AppError;