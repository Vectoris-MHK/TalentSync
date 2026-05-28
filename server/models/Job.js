import mongoose from "mongoose";


const jobSchema = new mongoose.Schema({
    title: {type:String,required:true},
    description: {type:String,required:true},
    location: {type:String,required:true},
    category: {type:String,required:true},
    level: {type:String,required:true},
    salary: {type:Number,required:true},
    date: {type:Number,required:true},
    visible: {type:Boolean, default: true},
    companyId: {type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true},
    embedding: {
        type: [Number],
        default: [],
        validate: {
            validator: v => v.length === 0 || v.length === 3072,
            message: "Embedding must be 0 or 3072 dimensions",
        },
    },

});

const Job = mongoose.model('Job', jobSchema)

export default Job 
