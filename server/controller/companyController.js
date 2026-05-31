import Company from "../models/Company.js";
import bcrypt from "bcryptjs";
import { v2 as cloudinary } from "cloudinary";
import generateToken from "../utils/generateToken.js";
import Job from "../models/Job.js";
import JobApplication from "../models/JobApplication.js";
import { generateJobEmbedding } from "../services/embeddingService.js";
// Register a new Company
export const registerCompany = async (req, res) => {
  const { name, email, password } = req.body;

  const imageFile = req.file;

  if (!name || !email || !password || !imageFile) {
    return res.json({ success: false, message: "Vui lòng điền đầy đủ tất cả các trường" });
  }

  try {
    const companyExists = await Company.findOne({ email });

    if (companyExists) {
      return res.json({ success: false, message: "Công ty đã tồn tại" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const imageUpload = await cloudinary.uploader.upload(imageFile.path);

    const company = await Company.create({
      name,
      email,
      password: hashedPassword,
      image: imageUpload.secure_url,
    });

    res.json({
      success: true,
      company: {
        _id: company._id,
        name: company.name,
        email: company.email,
        image: company.image,
      },
      token: generateToken(company._id),
    });
  } catch (error) {
    console.error("registerCompany error:", error);
    res.json({ success: false, message: "Đã xảy ra lỗi không mong muốn" });
  }
};

// Company Login
export const loginCompany = async (req, res) => {
  const { email, password } = req.body;

  try {
    const company = await Company.findOne({ email });

    if (!company) {
      return res.json({ success: false, message: "Email hoặc mật khẩu không hợp lệ" });
    }

    if (await bcrypt.compare(password, company.password)) {
      res.json({
        success: true,
        company: {
          _id: company._id,
          name: company.name,
          email: company.email,
          image: company.image,
        },
        token: generateToken(company._id),
      });
    } else
      res.json({
        success: false,
        message: "Email hoặc mật khẩu không hợp lệ",
      });
  } catch (error) {
    console.error("loginCompany error:", error);
    res.json({ success: false, message: "Đã xảy ra lỗi không mong muốn" });
  }
};

// Get company data
export const getCompanyData = async (req, res) => {
  const company = req.company;

  try {
    res.json({ success: true, company });
  } catch (error) {
    console.error("getCompanyData error:", error);
    res.json({ success: false, message: "Đã xảy ra lỗi không mong muốn" });
  }
};

// Post a new Job
export const postJob = async (req, res) => {
  const { title, description, location, salary, level, category } = req.body;

  const companyId = req.company._id;

  try {
    const newJob = new Job({
      title,
      description,
      location,
      salary,
      companyId,
      date: Date.now(),
      level,
      category,
    });

    await newJob.save();

    try {
      const embedding = await generateJobEmbedding(newJob);
      newJob.embedding = embedding;
      await newJob.save();
    } catch (err) {
      console.warn("Embedding generation failed, saved without embedding:", err.message);
    }

    res.json({ success: true, newJob });
  } catch (error) {
    console.error("postJob error:", error);
    res.json({ success: false, message: "Đã xảy ra lỗi không mong muốn" });
  }
};
// Get Company Job Applicants
export const getCompanyJobApplicants = async (req, res) => {
  try {
    const companyId = req.company._id;

    // Find Job applications for the user
    const applications = await JobApplication.find({ companyId })
      .populate("userId", "name image email resume")
      .populate("jobId", "title  location category level salary")
      .exec();

    return res.json({ success: true, applications });
  } catch (error) {
    console.error("getCompanyJobApplicants error:", error);
    res.json({ success: false, message: "Đã xảy ra lỗi không mong muốn" });
  }
};

// Get Company  Posted Jobs
export const getCompanyPostedJobs = async (req, res) => {
  try {
    const companyId = req.company._id;

    const jobsData = await Job.aggregate([
      { $match: { companyId } },
      {
        $lookup: {
          from: "jobapplications",
          localField: "_id",
          foreignField: "jobId",
          as: "applicants",
        },
      },
      { $addFields: { applicants: { $size: "$applicants" } } },
    ]);

    res.json({ success: true, jobsData });
  } catch (error) {
    console.error("Error:", error);
    res.json({ success: false, message: "Đã xảy ra lỗi không mong muốn" });
  }
};

// Change Job Application Status
export const ChangeJobApplicationStatus = async (req, res) => {
  
  try{
    const { id, status } = req.body;

  // Find Job Application and update Status

  await JobApplication.findOneAndUpdate(
    {_id: id,},
    {status}
  )
  res.json({success:true, message:"Đã cập nhật trạng thái"})
  }
  catch(error){
    console.error("ChangeJobApplicationStatus error:", error);
    res.json({success:false, message:"An unexpected error occurred"})
  }
  
  
};

// Change Job Visiblity
export const changeVisiblity = async (req, res) => {
  try {
    const { id } = req.body;

    const companyID = req.company._id;

    const job = await Job.findById(id);

    if (!job) {
      return res.json({ success: false, message: "Không tìm thấy công việc" });
    }

    if (companyID.toString() === job.companyId.toString()) {
      job.visible = !job.visible;
    }
    await job.save();
    res.json({ success: true, job });
  } catch (error) {
    console.error("changeVisiblity error:", error);
    res.json({ success: false, message: "Đã xảy ra lỗi không mong muốn" });
  }
};
