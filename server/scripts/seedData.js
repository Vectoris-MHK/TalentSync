import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import Job from "../models/Job.js";
import Company from "../models/Company.js";
import User from "../models/User.js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const crawlData = JSON.parse(readFileSync(resolve(__dirname, "../../data_sample.json"), "utf-8"));

import { uriFromSrv } from "./resolveSrv.js";

const MONGODB_URI = process.env.MONGODB_URI;

const baseCompanies = [
  { name: "FPT Software", email: "hr@fpt.com.vn", image: "https://res.cloudinary.com/dnzqfiqtz/image/upload/v1748328800/companies/fpt_software.png" },
  { name: "VNG Corporation", email: "hr@vng.com.vn", image: "https://res.cloudinary.com/dnzqfiqtz/image/upload/v1748328800/companies/vng.png" },
  { name: "Công ty TNHH Sáng tạo Việt", email: "hr@sangtaoviet.com.vn", image: "https://res.cloudinary.com/dnzqfiqtz/image/upload/v1748328800/companies/sangtaoviet.png" },
];

function normalizeSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function parseLevel(levelStr) {
  const match = levelStr.match(/(\d+)/);
  if (!match) return "Trung cấp";
  const years = parseInt(match[1]);
  if (years <= 1) return "Sơ cấp";
  if (years <= 3) return "Trung cấp";
  if (years <= 5) return "Cao cấp";
  return "Quản lý";
}

function mapCategory(raw) {
  const c = (raw || "").toLowerCase();
  if (c.includes("thiết kế") || c.includes("design") || c.includes("sáng tạo")) return "Thiết kế";
  if (c.includes("marketing") || c.includes("tiếp thị")) return "Marketing";
  if (c.includes("tài chính") || c.includes("kế toán") || c.includes("kiểm toán") || c.includes("finance")) return "Tài chính";
  if (c.includes("quản lý") || c.includes("nhân sự") || c.includes("management") || c.includes("hr")) return "Quản lý";
  return "Lập trình";
}

function transformCrawledJob(raw) {
  return {
    title: raw.job_title,
    description: raw.description_html || `<p>${raw.description}</p>`,
    location: raw.location,
    category: mapCategory(raw.category),
    level: parseLevel(raw.level),
    salary: raw.salary > 0 ? raw.salary : 25000000,
    date: raw.date,
    visible: raw.visible !== false,
    _companyName: raw.company,
  };
}

const crawledJobs = crawlData.map(transformCrawledJob);

const crawledCompanyNames = [...new Set(crawledJobs.map((j) => j._companyName))];
const crawledCompanies = crawledCompanyNames.map((name, i) => ({
  name,
  email: `hr_crawl_${i}@talentsync.vn`,
  image: "https://res.cloudinary.com/dnzqfiqtz/image/upload/v1748328800/companies/default_company.png",
}));

const now = Date.now();
const oneDay = 86400000;

const hardcodedJobs = [
  { title: "Lập trình viên ReactJS", description: "<h2>Mô tả công việc</h2><p>Chúng tôi đang tìm kiếm Lập trình viên ReactJS tài năng để phát triển các ứng dụng web hiện đại.</p><h3>Yêu cầu</h3><ul><li>Tối thiểu 2 năm kinh nghiệm với ReactJS</li><li>Thành thạo JavaScript ES6+, TypeScript</li><li>Có kinh nghiệm với Redux, React Hooks, Context API</li></ul>", location: "Hồ Chí Minh", category: "Lập trình", level: "Trung cấp", salary: 25000000, date: now - oneDay * 2, visible: true },
  { title: "Senior Backend Developer (NodeJS/Java)", description: "<h2>Mô tả công việc</h2><p>Tham gia phát triển và tối ưu hệ thống backend cho nền tảng thương mại điện tử hàng đầu Việt Nam.</p><h3>Yêu cầu</h3><ul><li>5+ năm kinh nghiệm phát triển backend</li><li>Thành thạo NodeJS, Express và/hoặc Spring Boot</li><li>Kinh nghiệm với MongoDB, PostgreSQL</li></ul>", location: "Hồ Chí Minh", category: "Lập trình", level: "Cao cấp", salary: 60000000, date: now - oneDay * 1, visible: true },
  { title: "Kỹ sư DevOps (AWS/GCP)", description: "<h2>Mô tả công việc</h2><p>Chúng tôi cần một Kỹ sư DevOps giàu kinh nghiệm để xây dựng và duy trì hạ tầng cloud, tự động hóa quy trình CI/CD.</p><h3>Yêu cầu</h3><ul><li>3+ năm kinh nghiệm DevOps</li><li>Thành thạo AWS (EC2, EKS, RDS, S3) hoặc GCP</li></ul>", location: "Đà Nẵng", category: "Lập trình", level: "Cao cấp", salary: 45000000, date: now - oneDay * 5, visible: true },
  { title: "Lập trình viên Java Spring Boot", description: "<h2>Mô tả công việc</h2><p>Phát triển các ứng dụng doanh nghiệp sử dụng Java Spring Boot.</p><h3>Yêu cầu</h3><ul><li>2+ năm kinh nghiệm Java, Spring Boot</li><li>Hiểu biết về Microservices, REST API</li></ul>", location: "Hà Nội", category: "Lập trình", level: "Trung cấp", salary: 22000000, date: now - oneDay * 3, visible: true },
  { title: "Full-Stack Developer (MERN)", description: "<h2>Mô tả công việc</h2><p>Chúng tôi tìm kiếm Full-Stack Developer thành thạo MongoDB, Express, React, NodeJS.</p><h3>Yêu cầu</h3><ul><li>3+ năm kinh nghiệm MERN stack</li><li>Thành thạo ReactJS, Redux, NodeJS</li><li>Kinh nghiệm với MongoDB aggregations</li></ul>", location: "Hồ Chí Minh", category: "Lập trình", level: "Trung cấp", salary: 28000000, date: now - oneDay * 7, visible: true },
  { title: "Mobile Developer (React Native/Flutter)", description: "<h2>Mô tả công việc</h2><p>Phát triển ứng dụng di động cho sản phẩm fintech với hàng triệu người dùng.</p><h3>Yêu cầu</h3><ul><li>2+ năm kinh nghiệm React Native hoặc Flutter</li><li>Có ứng dụng đã publish lên App Store/Google Play</li></ul>", location: "Hà Nội", category: "Lập trình", level: "Trung cấp", salary: 28000000, date: now - oneDay * 4, visible: true },
  { title: "Lập trình viên PHP Laravel", description: "<h2>Mô tả công việc</h2><p>Cần tuyển lập trình viên PHP Laravel để bảo trì và phát triển các tính năng mới cho hệ thống quản lý doanh nghiệp ERP.</p>", location: "Hồ Chí Minh", category: "Lập trình", level: "Sơ cấp", salary: 15000000, date: now - oneDay * 10, visible: true },
  { title: "Quality Assurance Engineer", description: "<h2>Mô tả công việc</h2><p>Đảm bảo chất lượng sản phẩm thông qua việc thiết kế test plan, viết test case, manual và automation testing.</p><h3>Yêu cầu</h3><ul><li>2+ năm kinh nghiệm QA/Testing</li><li>Kinh nghiệm viết automation test với Selenium/Cypress</li></ul>", location: "Hồ Chí Minh", category: "Lập trình", level: "Trung cấp", salary: 20000000, date: now - oneDay * 6, visible: true },
  { title: "Data Engineer", description: "<h2>Mô tả công việc</h2><p>Xây dựng và duy trì hệ thống data pipeline, data warehouse phục vụ cho phân tích dữ liệu lớn và machine learning.</p>", location: "Hồ Chí Minh", category: "Lập trình", level: "Cao cấp", salary: 50000000, date: now - oneDay * 3, visible: true },
  { title: "Unity Game Developer", description: "<h2>Mô tả công việc</h2><p>Phát triển game mobile và PC sử dụng Unity Engine.</p><h3>Yêu cầu</h3><ul><li>2+ năm kinh nghiệm Unity, C#</li></ul>", location: "Hồ Chí Minh", category: "Lập trình", level: "Trung cấp", salary: 25000000, date: now - oneDay * 8, visible: true },
  { title: "Blockchain Developer", description: "<h2>Mô tả công việc</h2><p>Phát triển smart contract và dApps trên Ethereum, Solana.</p><h3>Yêu cầu</h3><ul><li>Kinh nghiệm với Solidity, Rust</li></ul>", location: "Hồ Chí Minh", category: "Lập trình", level: "Cao cấp", salary: 70000000, date: now - oneDay * 1, visible: true },
  { title: "Frontend Developer (VueJS)", description: "<h2>Mô tả công việc</h2><p>Phát triển giao diện người dùng cho sản phẩm SaaS sử dụng VueJS và NuxtJS.</p>", location: "Đà Nẵng", category: "Lập trình", level: "Trung cấp", salary: 23000000, date: now - oneDay * 9, visible: true },
  { title: "Trưởng nhóm phát triển phần mềm (Tech Lead)", description: "<h2>Mô tả công việc</h2><p>Lãnh đạo nhóm 5-8 lập trình viên, định hướng kiến trúc kỹ thuật, review code.</p>", location: "Hồ Chí Minh", category: "Lập trình", level: "Quản lý", salary: 80000000, date: now - oneDay * 2, visible: true },
  { title: "UI/UX Designer", description: "<h2>Mô tả công việc</h2><p>Thiết kế trải nghiệm người dùng cho sản phẩm web và mobile.</p><h3>Yêu cầu</h3><ul><li>2+ năm kinh nghiệm UI/UX Design</li><li>Thành thạo Figma, Sketch</li></ul>", location: "Hồ Chí Minh", category: "Thiết kế", level: "Trung cấp", salary: 22000000, date: now - oneDay * 3, visible: true },
  { title: "Graphic Designer", description: "<h2>Mô tả công việc</h2><p>Thiết kế ấn phẩm truyền thông, banner quảng cáo, tài liệu marketing.</p>", location: "Hồ Chí Minh", category: "Thiết kế", level: "Sơ cấp", salary: 12000000, date: now - oneDay * 12, visible: true },
  { title: "Product Designer", description: "<h2>Mô tả công việc</h2><p>Định hình trải nghiệm sản phẩm từ ý tưởng đến triển khai.</p><h3>Yêu cầu</h3><ul><li>3+ năm kinh nghiệm thiết kế sản phẩm số</li></ul>", location: "Hà Nội", category: "Thiết kế", level: "Cao cấp", salary: 35000000, date: now - oneDay * 5, visible: true },
  { title: "Motion Graphics Designer", description: "<h2>Mô tả công việc</h2><p>Sản xuất video animation, motion graphics cho chiến dịch quảng cáo.</p>", location: "Hồ Chí Minh", category: "Thiết kế", level: "Trung cấp", salary: 20000000, date: now - oneDay * 7, visible: true },
  { title: "Game Designer", description: "<h2>Mô tả công việc</h2><p>Thiết kế gameplay, level design, hệ thống kinh tế trong game.</p>", location: "Hồ Chí Minh", category: "Thiết kế", level: "Trung cấp", salary: 25000000, date: now - oneDay * 6, visible: true },
  { title: "Digital Marketing Specialist", description: "<h2>Mô tả công việc</h2><p>Lập kế hoạch và thực hiện chiến dịch marketing số trên Google Ads, Facebook Ads, TikTok Ads.</p>", location: "Hồ Chí Minh", category: "Marketing", level: "Trung cấp", salary: 18000000, date: now - oneDay * 4, visible: true },
  { title: "Content Creator", description: "<h2>Mô tả công việc</h2><p>Sáng tạo nội dung đa nền tảng: blog, video ngắn, social media post, email marketing.</p>", location: "Hà Nội", category: "Marketing", level: "Sơ cấp", salary: 12000000, date: now - oneDay * 8, visible: true },
  { title: "SEO Specialist", description: "<h2>Mô tả công việc</h2><p>Xây dựng chiến lược SEO tổng thể, tối ưu on-page và off-page.</p>", location: "Hồ Chí Minh", category: "Marketing", level: "Trung cấp", salary: 20000000, date: now - oneDay * 10, visible: true },
  { title: "Brand Manager", description: "<h2>Mô tả công việc</h2><p>Xây dựng và phát triển thương hiệu, quản lý chiến lược định vị thương hiệu.</p>", location: "Hồ Chí Minh", category: "Marketing", level: "Cao cấp", salary: 40000000, date: now - oneDay * 2, visible: true },
  { title: "Social Media Marketing", description: "<h2>Mô tả công việc</h2><p>Quản lý và phát triển kênh mạng xã hội: Facebook, Instagram, TikTok, LinkedIn.</p>", location: "Đà Nẵng", category: "Marketing", level: "Sơ cấp", salary: 11000000, date: now - oneDay * 14, visible: true },
  { title: "Kế toán tổng hợp", description: "<h2>Mô tả công việc</h2><p>Thực hiện công tác kế toán tổng hợp: hạch toán, lập báo cáo tài chính, quyết toán thuế.</p>", location: "Hồ Chí Minh", category: "Tài chính", level: "Trung cấp", salary: 18000000, date: now - oneDay * 5, visible: true },
  { title: "Chuyên viên phân tích tài chính", description: "<h2>Mô tả công việc</h2><p>Phân tích báo cáo tài chính, đánh giá hiệu quả đầu tư, xây dựng mô hình tài chính dự báo.</p>", location: "Hà Nội", category: "Tài chính", level: "Cao cấp", salary: 35000000, date: now - oneDay * 7, visible: true },
  { title: "Kiểm toán nội bộ", description: "<h2>Mô tả công việc</h2><p>Thực hiện kiểm toán nội bộ định kỳ và đột xuất, đánh giá rủi ro và kiểm soát nội bộ.</p>", location: "Hồ Chí Minh", category: "Tài chính", level: "Trung cấp", salary: 25000000, date: now - oneDay * 9, visible: true },
  { title: "Quản lý dự án (Project Manager)", description: "<h2>Mô tả công việc</h2><p>Quản lý dự án từ khởi tạo đến bàn giao, đảm bảo đúng tiến độ, ngân sách và chất lượng.</p>", location: "Hồ Chí Minh", category: "Quản lý", level: "Cao cấp", salary: 40000000, date: now - oneDay * 3, visible: true },
  { title: "Quản lý nhân sự (HR Manager)", description: "<h2>Mô tả công việc</h2><p>Xây dựng và triển khai chiến lược nhân sự, quản lý tuyển dụng, đào tạo và phát triển nhân tài.</p>", location: "Hà Nội", category: "Quản lý", level: "Quản lý", salary: 35000000, date: now - oneDay * 6, visible: true },
];

const usersData = Array.from({ length: 10 }, (_, i) => ({
  _id: `user_seed_${i + 1}`,
  name: `Người dùng ${i + 1}`,
  email: `user${i + 1}@talentsync.vn`,
  image: "https://res.cloudinary.com/dnzqfiqtz/image/upload/v1748328800/users/default_avatar.png",
  preferences: [],
  embedding: [],
}));

async function seed() {
  await mongoose.connect(await uriFromSrv(MONGODB_URI), { dbName: "job-portal", serverSelectionTimeoutMS: 15000, connectTimeoutMS: 15000 });
  console.log("Connected to MongoDB");

  await Job.deleteMany({});
  await Company.deleteMany({});
  await User.deleteMany({ _id: /^user_seed_/ });
  console.log("Cleared existing data");

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash("password123", salt);

  const allCompaniesData = [...baseCompanies, ...crawledCompanies].map((c) => ({
    ...c,
    password: hashedPassword,
  }));
  const companies = await Company.create(allCompaniesData);
  console.log(`Created ${companies.length} companies (${baseCompanies.length} base + ${crawledCompanies.length} crawled)`);

  const companyByName = {};
  for (const c of companies) {
    companyByName[c.name] = c._id;
  }

  function assignCompanyId(job, index) {
    if (job._companyName && companyByName[job._companyName]) {
      return companyByName[job._companyName];
    }
    const baseNames = baseCompanies.map((c) => c.name);
    return companyByName[baseNames[index % baseNames.length]];
  }

  const allJobs = [
    ...crawledJobs.map((j, i) => {
      const { _companyName, ...rest } = j;
      return { ...rest, companyId: assignCompanyId(j, i) };
    }),
    ...hardcodedJobs.map((j, i) => ({ ...j, companyId: assignCompanyId(j, i + crawledJobs.length) })),
  ];

  const jobs = await Job.create(allJobs);
  console.log(`Created ${jobs.length} jobs (${crawledJobs.length} crawled + ${hardcodedJobs.length} hardcoded)`);

  const users = await User.create(usersData);
  console.log(`Created ${users.length} users`);

  console.log(`\nSeed summary: ${companies.length} companies | ${jobs.length} jobs | ${users.length} users`);

  await mongoose.disconnect();
  console.log("Disconnected");
}

seed().catch((err) => { console.error("Seed failed:", err); process.exit(1); });
