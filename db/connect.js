const mongoose =  require ('mongoose')

const connectDB = (url) =>
{
    console.log("connected to mongodb succesfully");
    return mongoose.connect (url)
}

module.exports= connectDB