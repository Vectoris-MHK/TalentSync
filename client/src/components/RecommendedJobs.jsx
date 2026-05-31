import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";
import { AppContext } from "../context/AppContext";
import JobCard from "./JobCard";
import { motion } from "framer-motion";
import { FiStar } from "react-icons/fi";

// Per-card badge labels mapped to API `mode` field
const MODE_BADGE = {
  hybrid: {
    label: "Phù hợp với kỹ năng của bạn",
    color: "bg-indigo-50 text-indigo-600 border-indigo-100",
  },
  collaborative: {
    label: "Tương tự việc làm bạn đã xem",
    color: "bg-purple-50 text-purple-600 border-purple-100",
  },
  preferences: {
    label: "Dựa trên sở thích của bạn",
    color: "bg-blue-50 text-blue-600 border-blue-100",
  },
  popular: {
    label: "Phổ biến trong lĩnh vực của bạn",
    color: "bg-emerald-50 text-emerald-600 border-emerald-100",
  },
};

const SkeletonCard = () => (
  <div className="min-w-[340px] max-w-[340px] rounded-2xl border border-gray-200 bg-white p-6 shadow-sm animate-pulse">
    <div className="mb-3 space-y-2">
      <div className="h-5 bg-gray-200 rounded w-3/4" />
      <div className="h-4 bg-gray-200 rounded w-1/2" />
      <div className="h-3 bg-gray-200 rounded w-1/3" />
    </div>
    <div className="space-y-2 mb-4">
      <div className="h-3 bg-gray-100 rounded w-full" />
      <div className="h-3 bg-gray-100 rounded w-5/6" />
    </div>
    <div className="flex gap-2">
      <div className="h-6 w-20 bg-gray-100 rounded-full" />
      <div className="h-6 w-16 bg-gray-100 rounded-full" />
    </div>
  </div>
);

const RecommendedJobs = () => {
  const { backendUrl, userData } = useContext(AppContext);
  const { getToken } = useAuth();

  const [jobs, setJobs] = useState([]);
  const [mode, setMode] = useState("popular");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userData) return;

    const fetchRecommendations = async () => {
      setLoading(true);
      try {
        const token = await getToken();
        const { data } = await axios.get(
          `${backendUrl}/api/jobs/recommend-feed`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (data.success && data.jobs?.length > 0) {
          setJobs(data.jobs);
          setMode(data.mode || "popular");
        }
      } catch {
        // Silently degrade — show empty state
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [userData, backendUrl, getToken]);

  return (
    <section className="max-w-7xl mx-auto px-4 lg:px-8 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <FiStar className="text-indigo-500 text-xl" />
          <h2 className="text-2xl font-bold text-gray-900">
            Việc làm gợi ý cho bạn
          </h2>
        </div>
        <span className="text-xs px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 font-medium border border-indigo-100">
          AI Powered
        </span>
      </div>

      {/* Loading skeletons */}
      {loading && (
        <div className="overflow-x-auto pb-4 -mx-4 px-4">
          <div className="flex gap-5" style={{ width: "max-content" }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && jobs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <span className="text-5xl mb-4">📋</span>
          <p className="text-gray-500 text-sm max-w-xs">
            Hoàn thiện hồ sơ để nhận gợi ý việc làm phù hợp
          </p>
        </div>
      )}

      {/* Horizontal scroll job cards */}
      {!loading && jobs.length > 0 && (
        <div className="overflow-x-auto pb-4 -mx-4 px-4">
          <div className="flex gap-5" style={{ width: "max-content" }}>
            {jobs.map((job, index) => (
              <motion.div
                key={job._id}
                className="min-w-[340px] max-w-[340px] h-full"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.07 }}
              >
                <JobCard
                  job={job}
                  recommendBadge={
                    MODE_BADGE[job.source] ||
                    MODE_BADGE[mode] ||
                    MODE_BADGE.popular
                  }
                />
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default RecommendedJobs;
