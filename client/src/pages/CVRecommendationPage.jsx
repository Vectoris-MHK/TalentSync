import { useState, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, useUser } from "@clerk/clerk-react";
import axios from "axios";
import { FiUploadCloud, FiFile, FiX } from "react-icons/fi";
import { AppContext } from "../context/AppContext";
import { JobCategories, JobLocations } from "../assets/assets";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const LOADING_PHASES = [
  "Đang tải CV lên...",
  "Đang đọc nội dung CV...",
  "Đang phân tích kỹ năng...",
  "Đang tìm việc làm phù hợp...",
];

const ACCEPTED_TYPES = ["application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/png", "image/jpeg"];

const CVRecommendationPage = () => {
  const navigate = useNavigate();
  const { isSignedIn } = useUser();
  const { getToken } = useAuth();
  const { backendUrl } = useContext(AppContext);

  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [location, setLocation] = useState("");
  const [level, setLevel] = useState("");
  const [category, setCategory] = useState("");
  const [loadingPhase, setLoadingPhase] = useState(-1);
  const [jobs, setJobs] = useState(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  // Redirect if not signed in
  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center flex-col gap-4">
          <p className="text-gray-600 text-lg">Bạn cần đăng nhập để sử dụng tính năng này.</p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            Về trang chủ
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  const validateFile = (f) => {
    if (!ACCEPTED_TYPES.includes(f.type)) {
      setError("Chỉ hỗ trợ PDF, DOCX, PNG, JPG");
      return false;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError("File quá lớn. Tối đa 10MB.");
      return false;
    }
    setError("");
    return true;
  };

  const handleFileSelect = (f) => {
    if (f && validateFile(f)) setFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFileSelect(f);
  };

  const handleSubmit = async () => {
    if (!file) return;
    setJobs(null);
    setError("");

    const formData = new FormData();
    formData.append("cv", file);

    const params = new URLSearchParams();
    if (location) params.set("location", location);
    if (level) params.set("level", level);
    if (category) params.set("category", category);

    try {
      // Simulate 4 loading phases
      for (let i = 0; i < LOADING_PHASES.length; i++) {
        setLoadingPhase(i);
        if (i < LOADING_PHASES.length - 1) {
          await new Promise((r) => setTimeout(r, 600));
        }
      }

      const token = await getToken();
      const url = `${backendUrl}/api/recommendations/from-cv${params.toString() ? "?" + params.toString() : ""}`;
      const { data } = await axios.post(url, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setLoadingPhase(-1);

      if (!data.success) {
        setError(data.message || "Đã xảy ra lỗi. Vui lòng thử lại.");
        return;
      }

      if (!data.jobs || data.jobs.length === 0) {
        setError("Chưa tìm thấy việc làm phù hợp. Thử điều chỉnh bộ lọc.");
        return;
      }

      setJobs(data.jobs);
    } catch (err) {
      setLoadingPhase(-1);
      const msg = err.response?.data?.message;
      setError(msg || "Không thể xử lý CV. Vui lòng thử lại.");
    }
  };

  const formatSalary = (s) => {
    if (!s) return "Thỏa thuận";
    return typeof s === "number" ? `${s.toLocaleString()} VNĐ` : s;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-10">
        <h1 className="text-3xl font-bold text-zinc-800 mb-2">Tìm việc từ CV của bạn</h1>
        <p className="text-gray-500 mb-8">Upload CV để nhận gợi ý việc làm phù hợp nhất với kỹ năng của bạn.</p>

        {/* Upload area */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !file && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer transition-colors ${
            dragOver ? "border-indigo-500 bg-indigo-50" : "border-gray-300 bg-white hover:border-indigo-400"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.png,.jpg,.jpeg"
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files[0])}
          />
          {file ? (
            <div className="flex items-center gap-3">
              <FiFile className="text-indigo-500 text-3xl" />
              <div>
                <p className="font-semibold text-zinc-700">{file.name}</p>
                <p className="text-sm text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setFile(null); setJobs(null); setError(""); }}
                className="ml-4 text-gray-400 hover:text-red-500 transition"
              >
                <FiX className="text-xl" />
              </button>
            </div>
          ) : (
            <>
              <FiUploadCloud className="text-indigo-400 text-5xl mb-3" />
              <p className="text-gray-600 font-medium">Kéo thả CV vào đây hoặc click để chọn file</p>
              <p className="text-xs text-gray-400 mt-1">PDF, DOCX, PNG, JPG — tối đa 10MB</p>
            </>
          )}
        </div>

        {error && (
          <p className="mt-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>
        )}

        {/* Filters */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="">Tất cả địa điểm</option>
            {JobLocations.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>

          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="">Tất cả cấp độ</option>
            {["Beginner Level", "Intermediate Level", "Senior Level"].map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="">Tất cả ngành nghề</option>
            {JobCategories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!file || loadingPhase >= 0}
          className="mt-6 w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loadingPhase >= 0 ? LOADING_PHASES[loadingPhase] : "Tìm việc làm phù hợp"}
        </button>

        {/* Results */}
        {jobs && jobs.length > 0 && (
          <div className="mt-10">
            <h2 className="text-xl font-bold text-zinc-800 mb-4">
              {jobs.length} việc làm phù hợp với CV của bạn
            </h2>
            <div className="flex flex-col gap-4">
              {jobs.map((job) => (
                <div key={job._id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition">
                  <div className="flex items-start gap-4">
                    <img
                      src={job.companyId?.image || "/default-company.png"}
                      alt="logo"
                      className="w-12 h-12 rounded-xl border border-gray-100 object-contain p-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <h3 className="font-bold text-zinc-800 text-base">{job.title}</h3>
                        <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full whitespace-nowrap">
                          {Math.round((job.finalScore || 0) * 100)}% phù hợp
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">{job.companyId?.name}</p>
                      <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-500">
                        <span>📍 {job.location}</span>
                        <span>💼 {job.level}</span>
                        <span>💰 {formatSalary(job.salary)}</span>
                      </div>

                      {/* Match reasons */}
                      {job.matchReasons?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {job.matchReasons.map((r) => (
                            <span key={r} className="px-2 py-0.5 text-xs rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {r}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4 justify-end">
                    <button
                      onClick={() => { navigate(`/apply-job/${job._id}`); window.scrollTo(0, 0); }}
                      className="px-4 py-2 text-xs font-semibold text-indigo-600 border border-indigo-500 rounded-md hover:bg-indigo-50 transition"
                    >
                      Xem chi tiết
                    </button>
                    <button
                      onClick={() => { navigate(`/apply-job/${job._id}`); window.scrollTo(0, 0); }}
                      className="px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 rounded-md transition"
                    >
                      Ứng tuyển
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default CVRecommendationPage;
