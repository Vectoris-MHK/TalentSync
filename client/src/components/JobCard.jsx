import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FiBookmark, FiMapPin, FiBriefcase, FiClock } from "react-icons/fi";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";
import PropTypes from "prop-types";
import { AppContext } from "../context/AppContext";

const JobCard = ({ job, recommendBadge }) => {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const { backendUrl, userData } = useContext(AppContext);
  const [isSaved, setIsSaved] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const stripHtmlTags = (html) => {
    if (!html) return "Chưa có mô tả";
    return html
      .replace(/<\/(p|h[1-6]|li|div|br|tr)\s*>/gi, "\n")
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  };

  const getTimePassed = (date) => {
    if (!date) return "Mới đăng";
    const diff = Date.now() - new Date(date);
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(mins / 60);
    const days = Math.floor(hrs / 24);
    if (days > 0) return `${days} ngày trước`;
    if (hrs > 0) return `${hrs} giờ trước`;
    if (mins > 0) return `${mins} phút trước`;
    return "Vừa xong";
  };

  const formatValue = (v) =>
    typeof v === "number" ? v.toLocaleString("vi-VN") : v;

  const formatSalary = (salary) => {
    if (!salary) return "Lương thỏa thuận";
    if (typeof salary === "string") return salary;
    if (typeof salary === "number") return salary.toLocaleString("vi-VN");
    if (salary.min && salary.max)
      return `${formatValue(salary.min)} - ${formatValue(salary.max)}`;
    if (salary.amount) return formatValue(salary.amount);
    return "Lương thỏa thuận";
  };

  // Fire bookmark event (weight=3) — only on first bookmark, no un-bookmark
  const handleBookmark = async () => {
    if (isSaved) return;
    setIsSaved(true); // optimistic UI
    if (!userData) return; // not logged in — UI only
    try {
      const token = await getToken();
      await axios.post(
        `${backendUrl}/api/users/events`,
        { jobId: job._id, eventType: "bookmark" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch {
      // non-critical — silently ignore
    }
  };

  return (
    <motion.div
      className="h-full"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      viewport={{ once: true }}
    >
      <motion.div
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 300 }}
        className="relative group p-1 rounded-2xl bg-gradient-to-tr from-white to-[#f9f9f9] border border-gray-200 hover:border-indigo-400 shadow-xl hover:shadow-2xl backdrop-blur-md transition-all duration-300 h-full"
      >
        <div className="bg-white rounded-2xl overflow-hidden h-full flex flex-col">
          {/* Header */}
          <div className="px-6 pt-6 pb-3 shrink-0">
            <h3 className="text-lg font-bold text-zinc-800 line-clamp-2">{job.title || "Chức danh"}</h3>
            <p className="text-sm text-gray-500 mt-0.5">{job.companyId?.name || "Công ty"}</p>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-xs text-gray-400">Đăng {getTimePassed(job.date)}</p>
              <span className="text-xs text-emerald-600 font-medium">₫ {formatSalary(job.salary)}</span>
            </div>
          </div>

          {/* Body: expands to fill space, footer pinned to bottom */}
          <div className="flex-1 px-6">
          {/* Tags */}
          <div className="pb-4 flex flex-wrap gap-2 text-xs font-medium">
            <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700">
              <FiMapPin className="text-sm" /> {job.location || "Từ xa"}
            </span>
            <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-pink-50 text-pink-600">
              <FiBriefcase className="text-sm" /> {job.level || "Trung cấp"}
            </span>
            {job.type && (
              <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-orange-50 text-orange-600">
                <FiClock className="text-sm" /> {job.type}
              </span>
            )}
          </div>

          {/* Recommendation badge */}
          {recommendBadge && (
            <div
              className={`mb-3 inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${recommendBadge.color}`}
            >
              <span>✨</span> {recommendBadge.label}
            </div>
          )}

          {/* Description */}
          <div className="pb-4">
            <p
              className={`text-sm text-gray-600 leading-relaxed ${
                isExpanded ? "" : "line-clamp-3"
              } cursor-pointer hover:text-black`}
              onClick={() => setIsExpanded(!isExpanded)}
              title="Nhấn để xem thêm"
            >
              {stripHtmlTags(job.description)}
            </p>
          </div>

          {/* Skills */}
          {job.skills?.length > 0 && (
            <div className="pb-4">
              <div className="flex flex-wrap gap-2">
                {job.skills.slice(0, 4).map((skill, index) => (
                  <motion.span
                    key={index}
                    whileHover={{ scale: 1.05 }}
                    className="px-3 py-1 text-xs rounded-full bg-gray-100 text-gray-700 font-medium"
                  >
                    {skill}
                  </motion.span>
                ))}
                {job.skills.length > 4 && (
                  <span className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-500">
                    +{job.skills.length - 4} kỹ năng khác
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Recommendation badge */}
          {recommendBadge && (
            <div
              className={`mb-3 inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${recommendBadge.color}`}
            >
              <span>✨</span> {recommendBadge.label}
            </div>
          )}

          </div>{/* end flex-1 body */}
          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center shrink-0">
            <button
              onClick={handleBookmark}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md transition border ${
                isSaved
                  ? "text-indigo-600 bg-indigo-50 border-indigo-200"
                  : "text-gray-500 bg-white border-gray-200 hover:text-indigo-600 hover:border-indigo-300"
              }`}
            >
              <FiBookmark className="text-sm" />
              {isSaved ? "Đã lưu" : "Lưu tin"}
            </button>
            <button
              onClick={() => {
                navigate(`/apply-job/${job._id}`);
                window.scrollTo(0, 0);
              }}
              className="px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 rounded-md hover:shadow-md"
            >
              Ứng tuyển ngay
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

JobCard.propTypes = {
  job: PropTypes.shape({
    _id: PropTypes.string,
    title: PropTypes.string,
    description: PropTypes.string,
    location: PropTypes.string,
    level: PropTypes.string,
    salary: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.object]),
    type: PropTypes.string,
    skills: PropTypes.arrayOf(PropTypes.string),
    postedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    companyId: PropTypes.shape({
      name: PropTypes.string,
      image: PropTypes.string,
    }),
  }),
  recommendBadge: PropTypes.shape({
    label: PropTypes.string,
    color: PropTypes.string,
  }),
};

JobCard.defaultProps = {
  job: {
    title: "",
    companyId: { name: "", image: "" },
    location: "",
    level: "",
    salary: null,
    type: "",
    description: "",
    skills: [],
    postedAt: null,
    _id: "",
  },
  recommendBadge: null,
};

export default JobCard;
