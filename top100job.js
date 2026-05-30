
const hardcodedJobs = [
  {
    title: "AI Engineer",
    description: "Nghiên cứu và phát triển các mô hình Deep Learning, tối ưu hóa các thuật toán Computer Vision và xử lý dữ liệu đa phương thức (Multimodal).",
    location: "TP. Hồ Chí Minh",
    category: "Artificial Intelligence",
    level: "Senior",
    salary: 45000000,
    date: now - oneDay * 0,
    visible: true
  },
  {
    title: "Fullstack Developer (Node.js/ReactJS)",
    description: "Tham gia phát triển hệ thống E-commerce hiệu năng cao, xây dựng RESTful API và tối ưu hóa giao diện người dùng.",
    location: "Hà Nội",
    category: "Software Development",
    level: "Junior",
    salary: 18000000,
    date: now - oneDay * 1,
    visible: true
  },
  {
    title: "Cloud Architect (AWS)",
    description: "Thiết kế hạ tầng đám mây bảo mật, tối ưu chi phí, cấu hình VPC, Endpoints và thiết lập luồng dữ liệu clickstream analytics.",
    location: "Remote",
    category: "Cloud & DevOps",
    level: "Expert",
    salary: 60000000,
    date: now - oneDay * 1,
    visible: true
  },
  {
    title: "Data Scientist",
    description: "Phân tích dữ liệu hành vi người dùng, xây dựng hệ thống gợi ý (Recommendation System) cho nền tảng giáo dục.",
    location: "TP. Hồ Chí Minh",
    category: "Data Science",
    level: "Middle",
    salary: 32000000,
    date: now - oneDay * 2,
    visible: true
  },
  {
    title: "UI/UX Designer",
    description: "Thiết kế wireframe, prototype cho ứng dụng di động và hệ thống Marketplace tri thức dành cho sinh viên.",
    location: "Đà Nẵng",
    category: "Design",
    level: "Junior",
    salary: 15000000,
    date: now - oneDay * 2,
    visible: true
  },
  {
    title: "Project Manager (IT)",
    description: "Quản lý tiến độ dự án, điều phối nguồn lực, kiểm soát rủi ro và các ràng buộc (Scope, Time, Cost) của dự án phần mềm.",
    location: "Hà Nội",
    category: "Project Management",
    level: "Manager",
    salary: 40000000,
    date: now - oneDay * 3,
    visible: true
  },
  {
    title: "Machine Learning Intern",
    description: "Hỗ trợ chuẩn bị dữ liệu, gán nhãn dữ liệu hình ảnh và huấn luyện thử nghiệm các mô hình Vision Transformer (ViT) cơ bản.",
    location: "TP. Hồ Chí Minh",
    category: "Artificial Intelligence",
    level: "Intern",
    salary: 60000000,
    date: now - oneDay * 3,
    visible: true
  },
  {
    title: "DevOps Engineer",
    description: "Triển khai hệ thống CI/CD, quản lý cụm Kubernetes (EKS) và giám sát hệ thống tự động hóa.",
    location: "Hà Nội",
    category: "Cloud & DevOps",
    level: "Middle",
    salary: 35000000,
    date: now - oneDay * 4,
    visible: true
  },
  {
    title: "Business Analyst (BA)",
    description: "Khảo sát và phân tích yêu cầu từ khách hàng, viết tài liệu SRS và bàn giao yêu cầu cho đội ngũ phát triển phần mềm.",
    location: "TP. Hồ Chí Minh",
    category: "Software Development",
    level: "Middle",
    salary: 25000000,
    date: now - oneDay * 4,
    visible: true
  },
  {
    title: "Mobile App Developer (Flutter)",
    description: "Phát triển và bảo trì ứng dụng hybrid chạy trên cả 2 nền tảng iOS và Android cho các dự án khởi nghiệp.",
    location: "Remote",
    category: "Software Development",
    level: "Senior",
    salary: 38000000,
    date: now - oneDay * 5,
    visible: true
  },
  {
    title: "Digital Marketing Specialist",
    description: "Lên kế hoạch và thực thi các chiến dịch Performance Marketing, tối ưu hóa SEO/SEM cho nền tảng Web EdTech.",
    location: "TP. Hồ Chí Minh",
    category: "Marketing",
    level: "Middle",
    salary: 20000000,
    date: now - oneDay * 5,
    visible: true
  },
  {
    title: "QA/QC Engineer",
    description: "Lập kế hoạch kiểm thử, viết test case, thực hiện manual test và viết script automation test cơ bản.",
    location: "Đà Nẵng",
    category: "Software Development",
    level: "Junior",
    salary: 14000000,
    date: now - oneDay * 6,
    visible: true
  },
  {
    title: "Content Creator",
    description: "Sáng tạo nội dung truyền thông cho các dự án giáo dục, viết kịch bản video ngắn và quản lý fanpage xã hội.",
    location: "Hà Nội",
    category: "Marketing",
    level: "Junior",
    salary: 12000000,
    date: now - oneDay * 6,
    visible: true
  },
  {
    title: "Frontend Developer (Vue.js)",
    description: "Xây dựng các dashboard quản trị thông minh cho hệ thống quản lý học tập độc lập.",
    location: "TP. Hồ Chí Minh",
    category: "Software Development",
    level: "Junior",
    salary: 17000000,
    date: now - oneDay * 7,
    visible: true
  },
  {
    title: "Data Engineer",
    description: "Xây dựng luồng ETL/ELT xử lý dữ liệu lớn từ nhiều nguồn khác nhau vào Data Warehouse trên đám mây.",
    location: "Hà Nội",
    category: "Data Science",
    level: "Senior",
    salary: 48000000,
    date: now - oneDay * 7,
    visible: true
  },
  {
    title: "Product Owner (PO)",
    description: "Định hình tầm nhìn sản phẩm, quản lý Product Backlog và làm việc chặt chẽ với Scrum Master để đảm bảo tiến độ sprint.",
    location: "TP. Hồ Chí Minh",
    category: "Project Management",
    level: "Manager",
    salary: 50000000,
    date: now - oneDay * 8,
    visible: true
  },
  {
    title: "Backend Developer (Java/Spring Boot)",
    description: "Phát triển hệ thống microservices lõi cho các dịch vụ tài chính ngân hàng số bảo mật cao.",
    location: "Hà Nội",
    category: "Software Development",
    level: "Senior",
    salary: 42000000,
    date: now - oneDay * 8,
    visible: true
  },
  {
    title: "Scrum Master",
    description: "Thúc đẩy áp dụng quy trình Agile/Scrum, loại bỏ các rào cản cho đội ngũ phát triển nhằm tối ưu năng suất làm việc.",
    location: "Remote",
    category: "Project Management",
    level: "Middle",
    salary: 30000000,
    date: now - oneDay * 9,
    visible: true
  },
  {
    title: "Graphic Designer",
    description: "Thiết kế các ấn phẩm truyền thông, bộ nhận diện thương hiệu cho các sự kiện và chiến dịch của công ty.",
    location: "Đà Nẵng",
    category: "Design",
    level: "Junior",
    salary: 13000000,
    date: now - oneDay * 9,
    visible: true
  },
  {
    title: "HR Tech Recruiter",
    description: "Tìm kiếm, kết nối và tuyển dụng nhân tài thuộc khối công nghệ như AI, Big Data, Cloud cho các dự án quy mô lớn.",
    location: "TP. Hồ Chí Minh",
    category: "Human Resources",
    level: "Middle",
    salary: 22000000,
    date: now - oneDay * 10,
    visible: true
  },
  {
    title: "Computer Vision Researcher",
    description: "Nghiên cứu các kiến trúc mạng nơ-ron mới ứng dụng vào bài toán nhận diện hành vi thời gian thực qua camera giám sát.",
    location: "Hà Nội",
    category: "Artificial Intelligence",
    level: "Senior",
    salary: 55000000,
    date: now - oneDay * 10,
    visible: true
  },
  {
    title: "Golang Developer",
    description: "Xây dựng các service có tính chịu tải cao và độ trễ thấp phục vụ lượng lớn kết nối đồng thời.",
    location: "TP. Hồ Chí Minh",
    category: "Software Development",
    level: "Senior",
    salary: 46000000,
    date: now - oneDay * 11,
    visible: true
  },
  {
    title: "Solutions Engineer",
    description: "Hỗ trợ khách hàng doanh nghiệp thiết kế và tích hợp các giải pháp công nghệ, API phần mềm vào hệ thống sẵn có.",
    location: "Remote",
    category: "Cloud & DevOps",
    level: "Middle",
    salary: 33000000,
    date: now - oneDay * 11,
    visible: true
  },
  {
    title: "Data Analyst",
    description: "Xây dựng các báo cáo tự động bằng PowerBI, theo dõi các chỉ số vận hành cốt lõi của doanh nghiệp giáo dục.",
    location: "TP. Hồ Chí Minh",
    category: "Data Science",
    level: "Junior",
    salary: 16000000,
    date: now - oneDay * 12,
    visible: true
  },
  {
    title: "Product Designer",
    description: "Nghiên cứu hành vi người dùng sâu sắc để cải tiến trải nghiệm luồng thanh toán và kết nối chuyên gia trên ứng dụng.",
    location: "Hà Nội",
    category: "Design",
    level: "Senior",
    salary: 35000000,
    date: now - oneDay * 12,
    visible: true
  },
  {
    title: "IT Project Coordinator",
    description: "Hỗ trợ Project Manager trong việc quản lý tài liệu dự án, sắp xếp các buổi họp sprint và theo dõi tiến độ công việc.",
    location: "Đà Nẵng",
    category: "Project Management",
    level: "Junior",
    salary: 14000000,
    date: now - oneDay * 13,
    visible: true
  },
  {
    title: "Python Web Developer",
    description: "Phát triển hệ thống backend bằng Django/FastAPI, tích hợp sẵn các API AI và hệ thống xử lý hàng đợi tác vụ.",
    location: "TP. Hồ Chí Minh",
    category: "Software Development",
    level: "Middle",
    salary: 28000000,
    date: now - oneDay * 13,
    visible: true
  },
  {
    title: "Cybersecurity Analyst",
    description: "Giám sát an ninh hệ thống mạng, rà soát lỗ hổng bảo mật ứng dụng Web/Mobile và đưa ra phương án khắc phục.",
    location: "Hà Nội",
    category: "Cloud & DevOps",
    level: "Senior",
    salary: 43000000,
    date: now - oneDay * 14,
    visible: true
  },
  {
    title: "NLP Engineer",
    description: "Xây dựng các hệ thống Chatbot thế hệ mới dựa trên việc tinh chỉnh (Fine-tuning) các mô hình ngôn ngữ lớn (LLM).",
    location: "TP. Hồ Chí Minh",
    category: "Artificial Intelligence",
    level: "Senior",
    salary: 47000000,
    date: now - oneDay * 14,
    visible: true
  },
  {
    title: "SEO Specialist",
    description: "Nghiên cứu từ khóa, tối ưu On-page/Off-page để tăng trưởng lưu lượng truy cập tự nhiên cho trang thông tin cộng đồng.",
    location: "Remote",
    category: "Marketing",
    level: "Junior",
    salary: 13000000,
    date: now - oneDay * 15,
    visible: true
  },
  {
    title: "React Native Developer",
    description: "Phát triển ứng dụng di động đa nền tảng tối ưu hiệu năng render UI và đồng bộ dữ liệu ngoại tuyến.",
    location: "Hà Nội",
    category: "Software Development",
    level: "Middle",
    salary: 27000000,
    date: now - oneDay * 15,
    visible: true
  },
  {
    title: "System Administrator",
    description: "Quản lý và vận hành hệ thống máy chủ Linux/Windows, xử lý các sự cố mạng và backup dữ liệu định kỳ.",
    location: "Đà Nẵng",
    category: "Cloud & DevOps",
    level: "Middle",
    salary: 20000000,
    date: now - oneDay * 16,
    visible: true
  },
  {
    title: "UI/UX Design Intern",
    description: "Hỗ trợ đội ngũ thiết kế vẽ lại các component UI, chuẩn bị tư liệu design system theo hướng dẫn mẫu.",
    location: "TP. Hồ Chí Minh",
    category: "Design",
    level: "Intern",
    salary: 5000000,
    date: now - oneDay * 16,
    visible: true
  },
  {
    title: "Technical Writing Specialist",
    description: "Viết tài liệu hướng dẫn sử dụng API, tài liệu kỹ thuật hệ thống cho các nhà phát triển bên ngoài.",
    location: "Remote",
    category: "Software Development",
    level: "Middle",
    salary: 24000000,
    date: now - oneDay * 17,
    visible: true
  },
  {
    title: "Growth Hacker",
    description: "Thử nghiệm các chiến thuật số sáng tạo nhằm tối ưu hóa tỷ lệ chuyển đổi và tăng trưởng đột biến lượng người dùng.",
    location: "TP. Hồ Chí Minh",
    category: "Marketing",
    level: "Senior",
    salary: 35000000,
    date: now - oneDay * 17,
    visible: true
  },
  {
    title: "Database Administrator (DBA)",
    description: "Tối ưu hóa các câu lệnh truy vấn SQL phức tạp, cấu hình phân cụm và đảm bảo tính sẵn sàng cao cho PostgreSQL.",
    location: "Hà Nội",
    category: "Data Science",
    level: "Senior",
    salary: 40000000,
    date: now - oneDay * 18,
    visible: true
  },
  {
    title: "HR Generalist",
    description: "Quản lý các thủ tục tiếp nhận nhân sự, tính lương cơ bản, xây dựng và phát triển văn hóa gắn kết nội bộ doanh nghiệp.",
    location: "TP. Hồ Chí Minh",
    category: "Human Resources",
    level: "Middle",
    salary: 18000000,
    date: now - oneDay * 18,
    visible: true
  },
  {
    title: "Embedded Systems Engineer",
    description: "Thiết kế phần cứng mạch điện tử, lập trình vi điều khiển cho các thiết bị IoT thông minh trong nông nghiệp.",
    location: "Hà Nội",
    category: "Software Development",
    level: "Middle",
    salary: 30000000,
    date: now - oneDay * 19,
    visible: true
  },
  {
    title: "Machine Learning Engineer",
    description: "Triển khai đưa các mô hình AI lên production (MLOps), đóng gói Docker container và giám sát độ trôi dữ liệu.",
    location: "TP. Hồ Chí Minh",
    category: "Artificial Intelligence",
    level: "Senior",
    salary: 50000000,
    date: now - oneDay * 19,
    visible: true
  },
  {
    title: "Social Media Manager",
    description: "Định hướng phát triển các kênh truyền thông mạng xã hội, xây dựng kế hoạch nội dung dài hạn định vị thương hiệu.",
    location: "Remote",
    category: "Marketing",
    level: "Middle",
    salary: 22000000,
    date: now - oneDay * 20,
    visible: true
  },
  {
    title: "Automation Test Lead",
    description: "Xây dựng framework kiểm thử tự động từ đầu sử dụng Selenium/Playwright, quản lý phân phối công việc cho đội QA.",
    location: "Hà Nội",
    category: "Software Development",
    level: "Senior",
    salary: 42000000,
    date: now - oneDay * 20,
    visible: true
  },
  {
    title: "Business Development Executive",
    description: "Tìm kiếm các đối tác trường đại học, kết nối mở rộng thị trường mạng lưới chuyên gia cố vấn cho sinh viên.",
    location: "TP. Hồ Chí Minh",
    category: "Sales & Account",
    level: "Junior",
    salary: 15000000,
    date: now - oneDay * 21,
    visible: true
  },
  {
    title: "SRE (Site Reliability Engineer)",
    description: "Tập trung vào tính khả dụng và khả năng mở rộng của hệ thống, xử lý tự động hóa các cảnh báo lỗi dịch vụ.",
    location: "Hà Nội",
    category: "Cloud & DevOps",
    level: "Senior",
    salary: 48000000,
    date: now - oneDay * 21,
    visible: true
  },
  {
    title: "Motion Graphic Designer",
    description: "Sản xuất các video chuyển động dạng 2D/3D phục vụ việc minh họa bài học trực quan hoặc giới thiệu tính năng sản phẩm.",
    location: "Remote",
    category: "Design",
    level: "Middle",
    salary: 21000000,
    date: now - oneDay * 22,
    visible: true
  },
  {
    title: "PHP Developer (Laravel)",
    description: "Bảo trì và phát triển các tính năng quản lý phân quyền chuyên sâu cho cổng thông tin nội bộ của hệ thống.",
    location: "Đà Nẵng",
    category: "Software Development",
    level: "Junior",
    salary: 16000000,
    date: now - oneDay * 22,
    visible: true
  },
  {
    title: "Deep Learning Specialist",
    description: "Nghiên cứu tối ưu hóa việc phân tách ảnh đa phổ (Multispectral) ứng dụng trong việc chẩn đoán tình trạng cây trồng.",
    location: "TP. Hồ Chí Minh",
    category: "Artificial Intelligence",
    level: "Senior",
    salary: 52000000,
    date: now - oneDay * 23,
    visible: true
  },
  {
    title: "Technical Support Engineer",
    description: "Tiếp nhận các lỗi kỹ thuật nâng cao từ phía khách hàng doanh nghiệp, hỗ trợ debug trực tiếp cấu hình mạng.",
    location: "Hà Nội",
    category: "Customer Service",
    level: "Junior",
    salary: 13000000,
    date: now - oneDay * 23,
    visible: true
  },
  {
    title: "Account Manager",
    description: "Duy trì mối quan hệ chiến lược với nhóm khách hàng VIP, xử lý các hợp đồng gia hạn dịch vụ lớn.",
    location: "TP. Hồ Chí Minh",
    category: "Sales & Account",
    level: "Manager",
    salary: 35000000,
    date: now - oneDay * 24,
    visible: true
  },
  {
    title: "Software Engineer Intern",
    description: "Được đào tạo các kiến thức căn bản về quy trình viết mã sạch, hỗ trợ viết unit test cho hệ thống.",
    location: "Hà Nội",
    category: "Software Development",
    level: "Intern",
    salary: 4500000,
    date: now - oneDay * 24,
    visible: true
  },
  {
    title: "Big Data Architect",
    description: "Thiết kế mô hình kiến trúc xử lý luồng dữ liệu cực lớn thời gian thực, kết hợp công nghệ Hadoop, Spark và Kafka.",
    location: "Remote",
    category: "Data Science",
    level: "Expert",
    salary: 65000000,
    date: now - oneDay * 25,
    visible: true
  },
  {
    title: "Branding Specialist",
    description: "Nghiên cứu định vị thị trường, xây dựng chiến lược truyền tải thông điệp nhân văn kết hợp giáo dục và công nghệ.",
    location: "TP. Hồ Chí Minh",
    category: "Marketing",
    level: "Middle",
    salary: 24000000,
    date: now - oneDay * 25,
    visible: true
  },
  {
    title: "Solidity Developer (Blockchain)",
    description: "Viết và kiểm tra các Smart Contract trên mạng lưới Ethereum nhằm tối ưu hóa bảo mật giao dịch số.",
    location: "Hà Nội",
    category: "Software Development",
    level: "Senior",
    salary: 55000000,
    date: now - oneDay * 26,
    visible: true
  },
  {
    title: "C++ Software Engineer",
    description: "Phát triển các module xử lý đồ họa tính toán hiệu năng cao chạy trực tiếp trên driver thiết bị đầu cuối.",
    location: "Đà Nẵng",
    category: "Software Development",
    level: "Senior",
    salary: 40000000,
    date: now - oneDay * 26,
    visible: true
  },
  {
    title: "HR Director",
    description: "Hoạch định toàn bộ chiến lược nhân sự toàn công ty, thiết lập chế độ đãi ngộ và lộ trình thăng tiến nhân sự dài hạn.",
    location: "TP. Hồ Chí Minh",
    category: "Human Resources",
    level: "Director",
    salary: 80000000,
    date: now - oneDay * 27,
    visible: true
  },
  {
    title: "AI Product Manager",
    description: "Quản lý vòng đời sản phẩm tích hợp tính năng AI, kết nối giữa nhu cầu thị trường và năng lực kỹ thuật của đội ngũ R&D.",
    location: "Hà Nội",
    category: "Project Management",
    level: "Manager",
    salary: 48000000,
    date: now - oneDay * 27,
    visible: true
  },
  {
    title: "Frontend Developer (Angular)",
    description: "Phát triển hệ thống ERP quản trị doanh nghiệp nội bộ với cấu trúc giao diện lớn phức tạp.",
    location: "TP. Hồ Chí Minh",
    category: "Software Development",
    level: "Middle",
    salary: 26000000,
    date: now - oneDay * 28,
    visible: true
  },
  {
    title: "Video Editor",
    description: "Cắt dựng và biên tập các sản phẩm video truyền thông sáng tạo cao dựa trên kịch bản văn học dân gian đương đại.",
    location: "Remote",
    category: "Design",
    level: "Junior",
    salary: 12000000,
    date: now - oneDay * 28,
    visible: true
  },
  {
    title: "Data Analyst Intern",
    description: "Thực hiện dọn dẹp dữ liệu thô, hỗ trợ kéo xuất báo cáo tuần từ hệ thống dữ liệu phân tích tập trung.",
    location: "Đà Nẵng",
    category: "Data Science",
    level: "Intern",
    salary: 4000000,
    date: now - oneDay * 29,
    visible: true
  },
  {
    title: "Ruby on Rails Developer",
    description: "Bảo trì ứng dụng web sẵn có, nâng cấp hệ thống kết nối và mở rộng khả năng tối ưu hóa database.",
    location: "Hà Nội",
    category: "Software Development",
    level: "Middle",
    salary: 28000000,
    date: now - oneDay * 29,
    visible: true
  },
  {
    title: "Copywriter",
    description: "Chịu trách nhiệm sáng tạo slogan, kịch bản quảng cáo sáng tạo ngắn cho các chiến dịch ra mắt ứng dụng mới.",
    location: "TP. Hồ Chí Minh",
    category: "Marketing",
    level: "Junior",
    salary: 14000000,
    date: now - oneDay * 30,
    visible: true
  },
  {
    title: "Cloud Security Engineer",
    description: "Cấu hình IAM, quản lý phân quyền chặt chẽ trên môi trường AWS AWS multi-tenant, bảo vệ hạ tầng chống tấn công mạng.",
    location: "Hà Nội",
    category: "Cloud & DevOps",
    level: "Senior",
    salary: 46000000,
    date: now - oneDay * 31,
    visible: true
  },
  {
    title: "C#/.NET Developer",
    description: "Xây dựng các ứng dụng desktop nghiệp vụ chuyên sâu và API kết nối hệ thống lõi cho đối tác khách hàng.",
    location: "Đà Nẵng",
    category: "Software Development",
    level: "Middle",
    salary: 24000000,
    date: now - oneDay * 32,
    visible: true
  },
  {
    title: "AI Engineer (Speech Recognition)",
    description: "Tập trung huấn luyện mô hình nhận diện giọng nói tiếng Việt vùng miền với độ chính xác cao.",
    location: "TP. Hồ Chí Minh",
    category: "Artificial Intelligence",
    level: "Senior",
    salary: 46000000,
    date: now - oneDay * 33,
    visible: true
  },
  {
    title: "Sales Executive",
    description: "Tư vấn giới thiệu các khóa đào tạo công nghệ chất lượng cao tới nhóm người dùng cá nhân có nhu cầu chuyển ngành.",
    location: "Hà Nội",
    category: "Sales & Account",
    level: "Junior",
    salary: 11000000,
    date: now - oneDay * 34,
    visible: true
  },
  {
    title: "Scrum Master Consultant",
    description: "Tư vấn doanh nghiệp lớn chuyển đổi mô hình vận hành truyền thống sang chuẩn Agile quy mô linh hoạt.",
    location: "Remote",
    category: "Project Management",
    level: "Senior",
    salary: 45000000,
    date: now - oneDay * 35,
    visible: true
  },
  {
    title: "UI/UX Designer (Web Focus)",
    description: "Tập trung thiết kế chuyển đổi tối ưu giao diện web đích landing-page thu hút đăng ký dịch vụ cao.",
    location: "TP. Hồ Chí Minh",
    category: "Design",
    level: "Middle",
    salary: 22000000,
    date: now - oneDay * 36,
    visible: true
  },
  {
    title: "Game Developer (Unity)",
    description: "Lập trình logic gameplay, xử lý tương tác vật lý chuyển động mượt mà cho dòng game giáo dục trí tuệ.",
    location: "Hà Nội",
    category: "Software Development",
    level: "Middle",
    salary: 29000000,
    date: now - oneDay * 37,
    visible: true
  },
  {
    title: "Compensation & Benefits Specialist",
    description: "Nghiên cứu cơ cấu thị trường lương, tối ưu hệ thống tính thưởng năng suất rõ ràng hiệu quả cho nhân viên.",
    location: "TP. Hồ Chí Minh",
    category: "Human Resources",
    level: "Middle",
    salary: 21000000,
    date: now - oneDay * 38,
    visible: true
  },
  {
    title: "Data Warehouse Engineer",
    description: "Thiết kế kiến trúc lưu trữ dữ liệu đa tầng chuyên sâu phục vụ khai thác phân tích thông minh.",
    location: "Hà Nội",
    category: "Data Science",
    level: "Senior",
    salary: 43000000,
    date: now - oneDay * 39,
    visible: true
  },
  {
    title: "Event Management Specialist",
    description: "Lên kế hoạch tổ chức chuỗi ngày hội kết nối hướng nghiệp công nghệ kết nối sinh viên và doanh nghiệp.",
    location: "TP. Hồ Chí Minh",
    category: "Marketing",
    level: "Middle",
    salary: 18000000,
    date: now - oneDay * 40,
    visible: true
  },
  {
    title: "QA Engineer (Automation)",
    description: "Viết kịch bản tự động kiểm thử hiệu năng chịu tải API microservices sử dụng công nghệ JMeter.",
    location: "Hà Nội",
    category: "Software Development",
    level: "Middle",
    salary: 26000000,
    date: now - oneDay * 41,
    visible: true
  },
  {
    title: "AI Research Fellow",
    description: "Nghiên cứu học thuật chuyên sâu lý thuyết thuật toán triết học giao thoa kiểm soát đạo đức trí tuệ nhân tạo.",
    location: "Remote",
    category: "Artificial Intelligence",
    level: "Expert",
    salary: 58000000,
    date: now - oneDay * 42,
    visible: true
  },
  {
    title: "Solutions Architect",
    description: "Định hình kiến trúc toàn bộ hệ thống phần mềm lớn phân tán bảo đảm vận hành mượt mà mở rộng tốt.",
    location: "TP. Hồ Chí Minh",
    category: "Software Development",
    level: "Senior",
    salary: 52000000,
    date: now - oneDay * 43,
    visible: true
  },
  {
    title: "Technical Lead",
    description: "Dẫn dắt đội ngũ kỹ sư phần mềm, chịu trách nhiệm phê duyệt cấu trúc code chất lượng cao dự án cốt lõi.",
    location: "Hà Nội",
    category: "Software Development",
    level: "Senior",
    salary: 50000000,
    date: now - oneDay * 44,
    visible: true
  },
  {
    title: "Customer Success Executive",
    description: "Đồng hành chăm sóc hỗ trợ người học đảm bảo họ đạt mục tiêu tối ưu lộ trình tri thức trên nền tảng kết nối.",
    location: "TP. Hồ Chí Minh",
    category: "Customer Service",
    level: "Junior",
    salary: 14000000,
    date: now - oneDay * 45,
    visible: true
  },
  {
    title: "Business Analyst Consultant",
    description: "Tư vấn doanh nghiệp tái thiết kế chuẩn hóa toàn bộ luồng quy trình vận hành kinh doanh thực tế số hóa.",
    location: "Hà Nội",
    category: "Software Development",
    level: "Senior",
    salary: 38000000,
    date: now - oneDay * 46,
    visible: true
  },
  {
    title: "DevOps Engineer (Junior)",
    description: "Hỗ trợ cấu hình quản lý hạ tầng cơ bản, viết script nhỏ tự động sao lưu cấu trúc log hệ thống máy chủ.",
    location: "Đà Nẵng",
    category: "Cloud & DevOps",
    level: "Junior",
    salary: 16000000,
    date: now - oneDay * 47,
    visible: true
  },
  {
    title: "Marketing Planner",
    description: "Nghiên cứu thị trường sâu sắc lập bảng ngân sách triển khai kế hoạch tiếp thị tổng thể ngắn hạn định kỳ.",
    location: "TP. Hồ Chí Minh",
    category: "Marketing",
    level: "Middle",
    salary: 23000000,
    date: now - oneDay * 48,
    visible: true
  },
  {
    title: "iOS Developer (Swift)",
    description: "Phát triển các tính năng native mượt mà chuyên sâu tối ưu trải nghiệm thiết bị hệ sinh thái Apple.",
    location: "Hà Nội",
    category: "Software Development",
    level: "Senior",
    salary: 40000000,
    date: now - oneDay * 49,
    visible: true
  },
  {
    title: "IT Support Technician",
    description: "Xử lý lắp đặt thiết bị mạng phần cứng nội bộ văn phòng, hỗ trợ kỹ thuật trực tiếp nhân viên công ty.",
    location: "TP. Hồ Chí Minh",
    category: "Customer Service",
    level: "Junior",
    salary: 11000000,
    date: now - oneDay * 50,
    visible: true
  },
  {
    title: "Information Security Manager",
    description: "Xây dựng các bộ tiêu chuẩn kiểm soát rủi ro thông tin doanh nghiệp chống rò rỉ dữ liệu khách hàng.",
    location: "Hà Nội",
    category: "Cloud & DevOps",
    level: "Manager",
    salary: 55000000,
    date: now - oneDay * 51,
    visible: true
  },
  {
    title: "Creative Director",
    description: "Định hình phong cách mỹ thuật hình ảnh trực quan cốt lõi cho mọi chiến dịch quảng bá thương hiệu lớn công ty.",
    location: "TP. Hồ Chí Minh",
    category: "Design",
    level: "Director",
    salary: 70000000,
    date: now - oneDay * 52,
    visible: true
  },
  {
    title: "Machine Learning Researcher",
    description: "Nghiên cứu tối ưu hóa tài nguyên phần cứng biên cho các mô hình AI chạy trực tiếp mượt mà trên thiết bị IoT.",
    location: "Remote",
    category: "Artificial Intelligence",
    level: "Senior",
    salary: 51000000,
    date: now - oneDay * 53,
    visible: true
  },
  {
    title: "Android Developer (Kotlin)",
    description: "Tập trung xây dựng ứng dụng mã nguồn mở tối ưu quản lý sử dụng dung lượng pin RAM thiết bị Android.",
    location: "Hà Nội",
    category: "Software Development",
    level: "Middle",
    salary: 28000000,
    date: now - oneDay * 54,
    visible: true
  },
  {
    title: "Internal Communications Specialist",
    description: "Xây dựng các chương trình kết nối chia sẻ nội bộ tăng tính thấu hiểu văn hóa tầm nhìn doanh nghiệp rộng khắp.",
    location: "TP. Hồ Chí Minh",
    category: "Human Resources",
    level: "Middle",
    salary: 17000000,
    date: now - oneDay * 55,
    visible: true
  },
  {
    title: "Data Scientist (NLP Focus)",
    description: "Xây dựng hệ thống tự động phân loại sắc thái bình luận khách hàng giúp cải thiện tức thì chất lượng phục vụ.",
    location: "Hà Nội",
    category: "Data Science",
    level: "Senior",
    salary: 46000000,
    date: now - oneDay * 56,
    visible: true
  },
  {
    title: "Sales Trainer",
    description: "Chịu trách nhiệm trực tiếp đào tạo kỹ năng tư vấn thuyết phục quy trình chuẩn cho nhân viên kinh doanh mới.",
    location: "TP. Hồ Chí Minh",
    category: "Sales & Account",
    level: "Middle",
    salary: 22000000,
    date: now - oneDay * 57,
    visible: true
  },
  {
    title: "Project Portfolio Manager",
    description: "Quản lý giám sát danh mục gồm chuỗi nhiều dự án công nghệ lớn đảm bảo đi đúng lộ trình trục chiến lược kinh doanh.",
    location: "Hà Nội",
    category: "Project Management",
    level: "Senior",
    salary: 58000000,
    date: now - oneDay * 58,
    visible: true
  },
  {
    title: "Frontend Intern (React)",
    description: "Thực hành chuyển đổi các bản vẽ thiết kế Figma thành mã nguồn HTML/CSS/JS sạch mượt đáp ứng responsive.",
    location: "Đà Nẵng",
    category: "Software Development",
    level: "Intern",
    salary: 4000000,
    date: now - oneDay * 59,
    visible: true
  },
  {
    title: "E-commerce Manager",
    description: "Chịu trách nhiệm toàn bộ chỉ số doanh thu vận hành gian hàng số quy mô lớn trên các kênh sàn điện tử.",
    location: "TP. Hồ Chí Minh",
    category: "Marketing",
    level: "Manager",
    salary: 42000000,
    date: now - oneDay * 60,
    visible: true
  },
  {
    title: "Infrastructure Engineer",
    description: "Thiết kế phân bổ lắp đặt hệ thống cáp quang, máy chủ vật lý mạng lõi phân tán ổn định cao cho doanh nghiệp.",
    location: "Hà Nội",
    category: "Cloud & DevOps",
    level: "Middle",
    salary: 27000000,
    date: now - oneDay * 61,
    visible: true
  },
  {
    title: "AI Specialist (Generative AI)",
    description: "Tích hợp ứng dụng công nghệ GenAI tối ưu hóa quy trình tự động sáng tạo tài liệu nội dung cho doanh nghiệp.",
    location: "Remote",
    category: "Artificial Intelligence",
    level: "Senior",
    salary: 53000000,
    date: now - oneDay * 62,
    visible: true
  },
  {
    title: "PR Specialist",
    description: "Xây dựng giữ vững mối quan hệ thân thiết với các cơ quan báo chí truyền thông khẳng định uy tín thương hiệu.",
    location: "TP. Hồ Chí Minh",
    category: "Marketing",
    level: "Middle",
    salary: 20000000,
    date: now - oneDay * 63,
    visible: true
  },
  {
    title: "Manual Tester",
    description: "Thực hiện chạy kiểm thử trực tiếp mọi tính năng giao diện phát hiện nhanh các lỗi hiển thị logic phần mềm.",
    location: "Đà Nẵng",
    category: "Software Development",
    level: "Junior",
    salary: 12000000,
    date: now - oneDay * 64,
    visible: true
  },
  {
    title: "BI Developer",
    description: "Thiết kế kho mô hình dữ liệu đa chiều thông minh trực quan hóa chỉ số tài chính phục vụ ban giám đốc.",
    location: "Hà Nội",
    category: "Data Science",
    level: "Middle",
    salary: 31000000,
    date: now - oneDay * 65,
    visible: true
  },
  {
    title: "Talent Acquisition Lead",
    description: "Dẫn dắt đội ngũ tuyển dụng thiết lập mạng lưới săn nhân tài cao cấp đáp ứng tốc độ tăng trưởng quy mô lớn.",
    location: "TP. Hồ Chí Minh",
    category: "Human Resources",
    level: "Senior",
    salary: 45000000,
    date: now - oneDay * 66,
    visible: true
  },
  {
    title: "Node.js Developer",
    description: "Tập trung tối ưu mã nguồn backend xử lý luồng ghi dữ liệu đồng thời lớn bảo đảm không nghẽn hệ thống.",
    location: "Hà Nội",
    category: "Software Development",
    level: "Middle",
    salary: 26000000,
    date: now - oneDay * 67,
    visible: true
  },
  {
    title: "Illustrator Artist",
    description: "Sáng tác vẽ các bộ nhân vật hình ảnh độc quyền lấy cảm hứng sâu sắc từ kho tàng văn hóa dân gian Việt Nam.",
    location: "Remote",
    category: "Design",
    level: "Middle",
    salary: 19000000,
    date: now - oneDay * 68,
    visible: true
  },
  {
    title: "Agile Coach",
    description: "Đào tạo huấn luyện tư duy Agile sâu sắc cho mọi cấp độ phòng ban nâng cao khả năng phản ứng linh hoạt linh động.",
    location: "TP. Hồ Chí Minh",
    category: "Project Management",
    level: "Expert",
    salary: 60000000,
    date: now - oneDay * 69,
    visible: true
  },
  {
    title: "Customer Support Team Lead",
    description: "Quản lý trực tiếp giám sát chất lượng hỗ trợ giải quyết thắc mắc khiếu nại của đội ngũ chăm sóc khách hàng.",
    location: "Hà Nội",
    category: "Customer Service",
    level: "Manager",
    salary: 25000000,
    date: now - oneDay * 70,
    visible: true
  },
  {
    title: "Deep Learning Engineer (MedTech)",
    description: "Phát triển và tinh chỉnh mô hình mạng nơ-ron tích chập (CNN) phân tích chẩn đoán chính xác tổn thương qua ảnh X-quang.",
    location: "TP. Hồ Chí Minh",
    category: "Artificial Intelligence",
    level: "Senior",
    salary: 49000000,
    date: now - oneDay * 71,
    visible: true
  },
  {
    title: "Python General Developer",
    description: "Viết các công cụ tự động hóa thu thập dữ liệu công khai từ các nguồn trang uy tín phục vụ nghiên cứu khoa học.",
    location: "Hà Nội",
    category: "Software Development",
    level: "Junior",
    salary: 16000000,
    date: now - oneDay * 72,
    visible: true
  },
  {
    title: "Cloud Operations Specialist",
    description: "Theo dõi trực ban kiểm soát trạng thái điện toán đám mây xử lý nhanh các tài nguyên quá tải cục bộ.",
    location: "Remote",
    category: "Cloud & DevOps",
    level: "Middle",
    salary: 29000000,
    date: now - oneDay * 73,
    visible: true
  },
  {
    title: "Data Visualization Expert",
    description: "Biến các tập dữ liệu số khô khan thành hệ thống biểu đồ tương tác thông minh sống động dễ hiểu nhìn thấy ngay.",
    location: "TP. Hồ Chí Minh",
    category: "Data Science",
    level: "Senior",
    salary: 38000000,
    date: now - oneDay * 74,
    visible: true
  },
  {
    title: "Graphic Design Intern",
    description: "Hỗ trợ cắt chỉnh sửa ảnh phối màu thiết kế banner phụ thuộc theo bố cục định dạng sẵn có của team marketing.",
    location: "Hà Nội",
    category: "Design",
    level: "Intern",
    salary: 4500000,
    date: now - oneDay * 75,
    visible: true
  },
  {
    title: "Project Risk Manager",
    description: "Chuyên sâu phân tích dự đoán các rủi ro kỹ thuật vận hành tài chính có thể xảy ra làm chậm tiến độ bàn giao.",
    location: "TP. Hồ Chí Minh",
    category: "Project Management",
    level: "Senior",
    salary: 46000000,
    date: now - oneDay * 76,
    visible: true
  },
  {
    title: "Backend Specialist (Go/Rust)",
    description: "Tái cấu trúc các dịch vụ nền tảng cũ sang ngôn ngữ mới nâng cao tối đa tốc độ phản hồi máy chủ lõi.",
    location: "Remote",
    category: "Software Development",
    level: "Senior",
    salary: 58000000,
    date: now - oneDay * 77,
    visible: true
  },
  {
    title: "Penetration Tester",
    description: "Đóng vai trò hacker mũ trắng trực tiếp tấn công thử nghiệm rà quét tìm điểm yếu hệ thống mạng nội bộ.",
    location: "Hà Nội",
    category: "Cloud & DevOps",
    level: "Senior",
    salary: 45000000,
    date: now - oneDay * 78,
    visible: true
  },
  {
    title: "Computer Vision Engineer",
    description: "Xây dựng hệ thống camera thông minh tự động đếm kiểm soát mật độ phương tiện giao thông thời gian thực.",
    location: "TP. Hồ Chí Minh",
    category: "Artificial Intelligence",
    level: "Middle",
    salary: 34000000,
    date: now - oneDay * 79,
    visible: true
  },
  {
    title: "Performance Marketing Lead",
    description: "Quản lý điều phối toàn bộ ngân sách quảng cáo số tối ưu trực tiếp chỉ số ROI mang lại doanh thu tức thì.",
    location: "Hà Nội",
    category: "Marketing",
    level: "Senior",
    salary: 41000000,
    date: now - oneDay * 80,
    visible: true
  },
  {
    title: "React JS Developer",
    description: "Xây dựng ứng dụng đơn trang (SPA) mượt mà tối ưu hóa vòng đời render component giảm thiểu giật lag UI.",
    location: "Đà Nẵng",
    category: "Software Development",
    level: "Middle",
    salary: 23000000,
    date: now - oneDay * 81,
    visible: true
  },
  {
    title: "Linux System Engineer",
    description: "Chuyên sâu tối ưu hóa nhân hệ điều hành Linux vận hành trên các siêu máy chủ tính toán khoa học lớn.",
    location: "Hà Nội",
    category: "Cloud & DevOps",
    level: "Senior",
    salary: 42000000,
    date: now - oneDay * 82,
    visible: true
  },
  {
    title: "UI/UX Researcher",
    description: "Thực hiện phỏng vấn sâu người dùng cuối ghi nhận trải nghiệm thực tế tìm ra điểm nghẽn của luồng ứng dụng.",
    location: "TP. Hồ Chí Minh",
    category: "Design",
    level: "Middle",
    salary: 24000000,
    date: now - oneDay * 83,
    visible: true
  },
  {
    title: "Technical Recruiter Specialist",
    description: "Xây dựng cơ sở dữ liệu hồ sơ ứng viên công nghệ chất lượng cao phản ứng nhanh nhu cầu dự án đột xuất.",
    location: "Remote",
    category: "Human Resources",
    level: "Middle",
    salary: 19000000,
    date: now - oneDay * 84,
    visible: true
  },
  {
    title: "Quantitative Analyst",
    description: "Ứng dụng các mô hình toán học thống kê xác suất phân tích xu hướng biến động dữ liệu thị trường tài chính.",
    location: "Hà Nội",
    category: "Data Science",
    level: "Senior",
    salary: 52000000,
    date: now - oneDay * 85,
    visible: true
  },
  {
    title: "Sales Specialist (SaaS)",
    description: "Tập trung tư vấn thuyết phục các doanh nghiệp chuyển đổi ứng dụng hệ thống phần mềm quản trị thuê bao đám mây.",
    location: "TP. Hồ Chí Minh",
    category: "Sales & Account",
    level: "Middle",
    salary: 20000000,
    date: now - oneDay * 86,
    visible: true
  },
  {
    title: "IT Project Executive",
    description: "Theo sát ghi nhật ký cập nhật trạng thái phân rã công việc chi tiết hàng ngày cho đội kỹ thuật phần mềm.",
    location: "Đà Nẵng",
    category: "Project Management",
    level: "Junior",
    salary: 13000000,
    date: now - oneDay * 87,
    visible: true
  },
  {
    title: "Flask/Django Developer",
    description: "Xây dựng hệ thống API tinh gọn bảo mật phục vụ đồng bộ dữ liệu ứng dụng Marketplace tri thức giáo dục.",
    location: "TP. Hồ Chí Minh",
    category: "Software Development",
    level: "Middle",
    salary: 27000000,
    date: now - oneDay * 88,
    visible: true
  },
  {
    title: "Cyber Security Engineer",
    description: "Thiết lập hệ thống tường lửa đa tầng ngăn chặn mọi nguy cơ xâm nhập trái phép vào vùng dữ liệu mật.",
    location: "Hà Nội",
    category: "Cloud & DevOps",
    level: "Senior",
    salary: 44000000,
    date: now - oneDay * 89,
    visible: true
  },
  {
    title: "AI Engineer (Recommendation System)",
    description: "Phát triển thuật toán học máy dự đoán chính xác nhu cầu tìm kiếm chuyên gia cố vấn phù hợp với từng sinh viên.",
    location: "TP. Hồ Chí Minh",
    category: "Artificial Intelligence",
    level: "Senior",
    salary: 48000000,
    date: now - oneDay * 90,
    visible: true
  },
  {
    title: "Content Marketing Executive",
    description: "Chịu trách nhiệm sản xuất các bài viết chuyên sâu chia sẻ tri thức định vị chuyên gia thương hiệu học tập.",
    location: "Remote",
    category: "Marketing",
    level: "Junior",
    salary: 12000000,
    date: now - oneDay * 91,
    visible: true
  },
  {
    title: "Mobile Developer Intern",
    description: "Hỗ trợ sửa các lỗi hiển thị UI cơ bản trên phiên bản ứng dụng di động thử nghiệm nội bộ công ty.",
    location: "Hà Nội",
    category: "Software Development",
    level: "Intern",
    salary: 4000000,
    date: now - oneDay * 92,
    visible: true
  },
  {
    title: "Kubernetes Systems Specialist",
    description: "Chuyên sâu cấu hình giám sát khả năng tự động co giãn (Auto-scaling) cụm máy chủ container chịu tải cực lớn.",
    location: "TP. Hồ Chí Minh",
    category: "Cloud & DevOps",
    level: "Senior",
    salary: 51000000,
    date: now - oneDay * 93,
    visible: true
  },
  {
    title: "Data Operations Analyst",
    description: "Kiểm soát dòng chảy luồng dữ liệu đảm bảo tính toàn vẹn không sai sót định dạng khi nạp vào hệ thống.",
    location: "Đà Nẵng",
    category: "Data Science",
    level: "Junior",
    salary: 15000000,
    date: now - oneDay * 94,
    visible: true
  },
  {
    title: "Interaction Designer",
    description: "Tập trung thiết kế các hiệu ứng phản hồi chuyển động vi mô tinh tế tạo cảm giác mượt mà thích thú cho người dùng.",
    location: "TP. Hồ Chí Minh",
    category: "Design",
    level: "Middle",
    salary: 25000000,
    date: now - oneDay * 95,
    visible: true
  },
  {
    title: "Technical Product Manager",
    description: "Sở hữu tầm nhìn kiến trúc công nghệ lõi đưa ra lộ trình phát hành các tính năng nền tảng API phức tạp.",
    location: "Hà Nội",
    category: "Project Management",
    level: "Manager",
    salary: 53000000,
    date: now - oneDay * 96,
    visible: true
  },
  {
    title: "SQL Developer",
    description: "Chuyên trách viết lưu trữ thủ tục (Stored Procedures) xử lý logic tính toán dữ liệu lớn định kỳ cuối ngày.",
    location: "TP. Hồ Chí Minh",
    category: "Software Development",
    level: "Middle",
    salary: 25000000,
    date: now - oneDay * 97,
    visible: true
  },
  {
    title: "Brand Manager",
    description: "Chịu trách nhiệm toàn diện quản lý hình ảnh sức khỏe thương hiệu nền tảng Marketplace kết nối học thuật rộng rãi.",
    location: "Hà Nội",
    category: "Marketing",
    level: "Manager",
    salary: 38000000,
    date: now - oneDay * 98,
    visible: true
  },
  {
    title: "HR Intern",
    description: "Hỗ trợ lọc hồ sơ ứng viên bước đầu, sắp xếp lịch hẹn phỏng vấn phối hợp cùng đội tuyển dụng công nghệ.",
    location: "TP. Hồ Chí Minh",
    category: "Human Resources",
    level: "Intern",
    salary: 5000000,
    date: now - oneDay * 99,
    visible: true
  },
  {
    title: "Lead AI Scientist",
    description: "Dẫn dắt định hướng toàn bộ chiến lược nghiên cứu phát triển các giải pháp trí tuệ nhân tạo cốt lõi thế hệ tiếp theo.",
    location: "Remote",
    category: "Artificial Intelligence",
    level: "Expert",
    salary: 75000000,
    date: now - oneDay * 100,
    visible: true
  }
];