import { useState } from "react";
import PropTypes from "prop-types";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";

const CATEGORIES = [
  { label: "Lập trình", emoji: "💻" },
  { label: "Thiết kế", emoji: "🎨" },
  { label: "Marketing", emoji: "📣" },
  { label: "Tài chính", emoji: "💰" },
  { label: "Quản lý", emoji: "📋" },
  { label: "Kinh doanh", emoji: "🤝" },
];

const OnboardingModal = ({ backendUrl, onClose }) => {
  const { getToken } = useAuth();
  const [selected, setSelected] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const toggle = (label) => {
    setSelected((prev) =>
      prev.includes(label) ? prev.filter((c) => c !== label) : [...prev, label],
    );
  };

  const handleSubmit = async () => {
    if (selected.length === 0) {
      toast.error("Vui lòng chọn ít nhất một lĩnh vực.");
      return;
    }
    setSubmitting(true);
    try {
      const token = await getToken();
      const { data } = await axios.post(
        `${backendUrl}/api/users/preferences`,
        { preferences: selected },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (data.success) {
        toast.success("Đã lưu sở thích của bạn!");
        onClose(selected);
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Không thể lưu sở thích. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 20 }}
        >
          {/* Header */}
          <div className="text-center mb-6">
            <span className="text-4xl">👋</span>
            <h2 className="text-2xl font-bold text-gray-900 mt-3">
              Chào mừng đến TalentSync!
            </h2>
            <p className="text-gray-500 mt-2 text-sm">
              Chọn lĩnh vực bạn quan tâm để nhận gợi ý việc làm phù hợp nhất.
            </p>
          </div>

          {/* Category grid */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {CATEGORIES.map(({ label, emoji }) => {
              const isSelected = selected.includes(label);
              return (
                <motion.button
                  key={label}
                  onClick={() => toggle(label)}
                  whileTap={{ scale: 0.96 }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all duration-200 ${
                    isSelected
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                      : "border-gray-200 bg-white text-gray-700 hover:border-indigo-300 hover:bg-indigo-50/50"
                  }`}
                >
                  <span className="text-xl">{emoji}</span>
                  {label}
                  {isSelected && (
                    <span className="ml-auto text-indigo-500">✓</span>
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition disabled:opacity-60"
            >
              {submitting
                ? "Đang lưu..."
                : `Bắt đầu tìm việc (${selected.length} đã chọn)`}
            </button>
            <button
              onClick={() => onClose([])}
              className="w-full py-2 text-sm text-gray-400 hover:text-gray-600 transition"
            >
              Bỏ qua — hiển thị việc làm phổ biến
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

OnboardingModal.propTypes = {
  backendUrl: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default OnboardingModal;
