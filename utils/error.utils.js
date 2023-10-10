class AppError extends Error { // agar app mai koi error ati hai toh usko extennd karna chahte hai normal error ke upar
constructor(message,statusCode){
    
    super(message); //message pass to errorObject taki enrich hojaye
    this.statusCode=statusCode; // status code enrich
    Error.captureStackTrace(this,this.constructor) //(context,current controller) on which line error is there
}
}
export default AppError;